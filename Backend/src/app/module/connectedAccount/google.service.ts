import { google } from "googleapis"
import { envVars } from "../../config/env"
import AppError from "../../errorHelpers/AppError"
import status from "http-status"
import { decryptText, encryptText } from "../../utils/crypto"
import { prisma } from "../../lib/prisma"
import { AccountStatus, StorageProvider } from "../../../generated/prisma/enums"

// Helper to create OAuth2 Client instance
export const createOAuthClient = () => {
  return new google.auth.OAuth2(
    envVars.GOOGLE_CLIENT_ID,
    envVars.GOOGLE_CLIENT_SECRET,
    envVars.GOOGLE_ACCOUNT_CALLBACK_URL,
  )
}

// 1. Generate Google OAuth Login URL
const getGoogleAuthUrl = (userId: string) => {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent select_account",
    scope: [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    state: userId,
  })
}

// 2. Handle Google OAuth Callback
const handleGoogleCallback = async (code: string, userId: string) => {
  const client = createOAuthClient();

  // Exchange auth code for tokens
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token) {
    throw new AppError(status.BAD_REQUEST, "Failed to retrieve access token from Google");
  }
  client.setCredentials(tokens);

  // Fetch Google User Profile (email, id, avatar)
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data: googleUser } = await oauth2.userinfo.get();
  if (!googleUser || !googleUser.id || !googleUser.email) {
    throw new AppError(status.BAD_REQUEST, "Failed to retrieve user profile from Google");
  }

  // Encrypt tokens before storing in database
  const accessTokenEncrypted = encryptText(tokens.access_token);
  const refreshTokenEncrypted = tokens.refresh_token ? encryptText(tokens.refresh_token) : undefined;
  const tokenExpiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : new Date(Date.now() + 3600 * 1000);

  // Save or update ConnectedAccount in database
  const connectedAccount = await prisma.connectedAccount.upsert({
    where: {
      userId_provider_providerAccountId: {
        userId,
        provider: StorageProvider.GOOGLE_DRIVE,
        providerAccountId: googleUser.id,
      }
    },
    create: {
      userId,
      provider: StorageProvider.GOOGLE_DRIVE,
      providerAccountId: googleUser.id,
      email: googleUser.email,
      displayName: googleUser.name,
      avatarUrl: googleUser.picture,
      accessTokenEncrypted,
      refreshTokenEncrypted,
      tokenExpiresAt,
      status: AccountStatus.CONNECTED,
    },
    update: {
      email: googleUser.email,
      displayName: googleUser.name,
      avatarUrl: googleUser.picture,
      accessTokenEncrypted,
      ...(refreshTokenEncrypted && { refreshTokenEncrypted }),
      tokenExpiresAt,
      status: AccountStatus.CONNECTED,
      lastError: null,
    },
  });

  // Trigger quota sync
  await syncGoogleQuota(connectedAccount.id).catch(() => undefined);
  // Trigger root app folder creation & initial file sync
  await syncGoogleAppFolderFiles(connectedAccount.id).catch(() => undefined);

  return connectedAccount;
};

// 3. Get Authenticated Google Client with Auto Token Refresh
const getAuthedGoogleClient = async (accountId: string) => {
  const account = await prisma.connectedAccount.findUnique({
    where: {
      id: accountId,
    }
  });
  if (!account || !account.accessTokenEncrypted || !account.refreshTokenEncrypted) {
    throw new AppError(status.UNAUTHORIZED, "Google account tokens missing or disconnected");
  }
  const client = createOAuthClient();
  const accessToken = decryptText(account.accessTokenEncrypted);
  const refreshToken = decryptText(account.refreshTokenEncrypted);

  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: account.tokenExpiresAt ? account.tokenExpiresAt.getTime() : undefined,
  });

  // If token is expired or expiring in < 1 min, refresh it automatically
  if (account.tokenExpiresAt && account.tokenExpiresAt.getTime() < Date.now() + 60_000) {
    const refreshResult = await client.refreshAccessToken();
    const newCredentials = refreshResult.credentials;

    if (newCredentials.access_token) {
      await prisma.connectedAccount.update({
        where: { id: account.id },
        data: {
          accessTokenEncrypted: encryptText(newCredentials.access_token),
          tokenExpiresAt: new Date(newCredentials.expiry_date ?? Date.now() + 3600_000),
        },
      });
      client.setCredentials(newCredentials);
    }
  }
  return client;
}

// 4. Sync Storage Quota from Google Drive
const syncGoogleQuota = async (accountId: string) => {
  const authClient = await getAuthedGoogleClient(accountId);
  const drive = google.drive({ version: "v3", auth: authClient });

  const about = await drive.about.get({ fields: "storageQuota" });
  const quota = about.data.storageQuota;

  const total = quota?.limit ? BigInt(quota.limit) : null;
  const used = quota?.usage ? BigInt(quota.usage) : BigInt(0);
  const available = total !== null ? total - used : null;

  return prisma.connectedAccount.update({
    where: { id: accountId },
    data: {
      totalBytes: total,
      usedBytes: used,
      availableBytes: available,
      lastSyncedAt: new Date(),
    },
  });
};

// 5. Ensure Google Drive App Root Folder ("CloudFusion Workspace")
const ensureGoogleAppFolder = async (accountId: string) => {
  // 1. Fetch connected account details to get userId
  const account = await prisma.connectedAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new AppError(status.NOT_FOUND, "Connected account not found");
  }

  // 2. Check if root virtual folder already exists in PostgreSQL DB
  const existingRoot = await prisma.folder.findFirst({
    where: {
      userId: account.userId,
      connectedAccountId: account.id,
      isRoot: true,
    },
  });

  if (existingRoot && existingRoot.providerFolderId) {
    return existingRoot;
  }

  // 3. Obtain authed Google Drive API client
  const authClient = await getAuthedGoogleClient(accountId);
  const drive = google.drive({ version: "v3", auth: authClient });

  const FOLDER_NAME = "CloudFusion Workspace";
  const FOLDER_MIMETYPE = "application/vnd.google-apps.folder";

  // 4. Search Google Drive for existing folder with name 'CloudFusion Workspace'
  const searchResponse = await drive.files.list({
    q: `name = '${FOLDER_NAME}' and mimeType = '${FOLDER_MIMETYPE}' and 'root' in parents and trashed = false`,
    fields: "files(id, name)",
    pageSize: 1,
  });

  let providerFolderId: string;
  const foundFiles = searchResponse.data.files;

  if (foundFiles && foundFiles.length > 0 && foundFiles[0].id) {
    providerFolderId = foundFiles[0].id;
  } else {
    // 5. Create the folder in Google Drive if it doesn't exist
    const createResponse = await drive.files.create({
      requestBody: {
        name: FOLDER_NAME,
        mimeType: FOLDER_MIMETYPE,
        parents: ["root"],
      },
      fields: "id",
    });

    if (!createResponse.data.id) {
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        "Failed to create root app folder in Google Drive"
      );
    }

    providerFolderId = createResponse.data.id;
  }

  // 6. Save or update virtual root folder in PostgreSQL database
  if (existingRoot) {
    return prisma.folder.update({
      where: { id: existingRoot.id },
      data: { providerFolderId },
    });
  }

  return prisma.folder.create({
    data: {
      name: FOLDER_NAME,
      userId: account.userId,
      connectedAccountId: account.id,
      providerFolderId,
      isRoot: true,
    },
  });
};

// 6. Sync Files and Subfolders inside Google Drive App Root Folder into PostgreSQL DB
const syncGoogleAppFolderFiles = async (accountId: string) => {
  // 1. Ensure the root app folder exists in DB and Google Drive
  const rootFolder = await ensureGoogleAppFolder(accountId);

  if (!rootFolder.providerFolderId) {
    throw new AppError(
      status.BAD_REQUEST,
      "Root Google Drive folder ID missing"
    );
  }

  // 2. Obtain authed Google Drive API client
  const authClient = await getAuthedGoogleClient(accountId);
  const drive = google.drive({ version: "v3", auth: authClient });

  const FOLDER_MIMETYPE = "application/vnd.google-apps.folder";

  // 3. List all files and subfolders inside the App Root Folder in Google Drive
  const response = await drive.files.list({
    q: `'${rootFolder.providerFolderId}' in parents and trashed = false`,
    fields:
      "files(id, name, mimeType, size, webContentLink, webViewLink, thumbnailLink, createdTime, modifiedTime)",
    pageSize: 100,
  });

  const driveFiles = response.data.files ?? [];
  let syncedFoldersCount = 0;
  let syncedFilesCount = 0;

  // 4. Iterate over Google Drive items and sync into database
  for (const item of driveFiles) {
    if (!item.id || !item.name) continue;

    if (item.mimeType === FOLDER_MIMETYPE) {
      // Sync subfolder into Folder table
      const existingFolder = await prisma.folder.findFirst({
        where: {
          connectedAccountId: accountId,
          providerFolderId: item.id,
        },
      });

      if (!existingFolder) {
        await prisma.folder.create({
          data: {
            name: item.name,
            userId: rootFolder.userId,
            connectedAccountId: accountId,
            parentId: rootFolder.id,
            providerFolderId: item.id,
            isRoot: false,
          },
        });
        syncedFoldersCount++;
      }
    } else {
      // Sync file into File table
      const fileExtension = item.name.includes(".")
        ? item.name.split(".").pop() ?? null
        : null;

      const existingFile = await prisma.file.findFirst({
        where: {
          connectedAccountId: accountId,
          providerFileId: item.id,
        },
      });

      const fileData = {
        name: item.name,
        size: item.size ? BigInt(item.size) : BigInt(0),
        mimeType: item.mimeType ?? "application/octet-stream",
        extension: fileExtension,
        userId: rootFolder.userId,
        folderId: rootFolder.id,
        connectedAccountId: accountId,
        provider: StorageProvider.GOOGLE_DRIVE,
        providerFileId: item.id,
        webContentLink: item.webContentLink ?? null,
        webViewLink: item.webViewLink ?? null,
        thumbnailLink: item.thumbnailLink ?? null,
      };

      if (existingFile) {
        await prisma.file.update({
          where: { id: existingFile.id },
          data: fileData,
        });
      } else {
        await prisma.file.create({
          data: fileData,
        });
      }
      syncedFilesCount++;
    }
  }

  return {
    rootFolderId: rootFolder.id,
    providerFolderId: rootFolder.providerFolderId,
    syncedFoldersCount,
    syncedFilesCount,
    totalDriveItems: driveFiles.length,
  };
};



export const GoogleService = {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getAuthedGoogleClient,
  syncGoogleQuota,
  ensureGoogleAppFolder,
  syncGoogleAppFolderFiles,
};