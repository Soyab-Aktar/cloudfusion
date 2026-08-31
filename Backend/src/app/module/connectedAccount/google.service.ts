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
    envVars.GOOGLE_CALLBACK_URL,
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

export const GoogleService = {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getAuthedGoogleClient,
  syncGoogleQuota,
};