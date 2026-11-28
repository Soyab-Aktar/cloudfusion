import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { GoogleService } from "../connectedAccount/google.service";
import { StorageAdapterFactory } from "../storage/storageAdapter.factory";
import { FileService } from "../file/file.service";
import { IUploadFileInput } from "./upload.interface";

const pickBestAccount = async (
  userId: string,
  requiredBytes: bigint
): Promise<string> => {
  const accounts = await prisma.connectedAccount.findMany({
    where: {
      userId,
      status: "CONNECTED",
    },
  });

  if (accounts.length === 0) {
    throw new AppError(status.BAD_REQUEST, "No connected accounts found");
  }

  const eligible = accounts
    .filter(
      (acc) => acc.availableBytes === null || acc.availableBytes >= requiredBytes
    )
    .sort((a, b) => {
      const aFree = a.availableBytes ?? BigInt(0);
      const bFree = b.availableBytes ?? BigInt(0);
      return bFree > aFree ? 1 : bFree < aFree ? -1 : 0;
    });

  if (eligible.length === 0) {
    throw new AppError(
      status.INSUFFICIENT_STORAGE,
      "Not enough storage space available across your connected accounts"
    );
  }

  return eligible[0].id;
};

const resolveWorkspaceRootFolder = async (
  userId: string,
  accountId: string
) => {
  let rootFolder = await prisma.folder.findFirst({
    where: {
      userId,
      connectedAccountId: accountId,
      isRoot: true,
      isTrash: false,
    },
  });

  if (!rootFolder || !rootFolder.providerFolderId) {
    rootFolder = await GoogleService.ensureGoogleAppFolder(accountId);
  }

  if (!rootFolder?.providerFolderId) {
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to resolve CloudFusion Workspace root folder"
    );
  }

  return rootFolder;
};

const uploadFile = async (input: IUploadFileInput) => {
  const {
    userId,
    fileName,
    mimeType,
    size = 0,
    stream,
    folderId,
    policy,
    targetAccountId,
    getByteCount,
    onStreamStart,
  } = input;

  const requiredBytes = BigInt(Math.max(0, size));

  let targetFolder = null;
  if (folderId) {
    targetFolder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId,
        isTrash: false,
      },
    });

    if (!targetFolder) {
      throw new AppError(status.NOT_FOUND, "Target folder not found");
    }
  }

  let resolvedAccountId: string;

  if (targetFolder?.connectedAccountId) {
    if (
      policy === "manual" &&
      targetAccountId &&
      targetAccountId !== targetFolder.connectedAccountId
    ) {
      throw new AppError(
        status.BAD_REQUEST,
        "Selected account does not match the target folder's drive"
      );
    }

    const account = await prisma.connectedAccount.findFirst({
      where: {
        id: targetFolder.connectedAccountId,
        userId,
        status: "CONNECTED",
      },
    });

    if (!account) {
      throw new AppError(
        status.BAD_REQUEST,
        "The storage account for this folder is not connected"
      );
    }

    if (
      account.availableBytes !== null &&
      account.availableBytes < requiredBytes
    ) {
      throw new AppError(
        status.INSUFFICIENT_STORAGE,
        "Not enough storage space available in this folder's drive"
      );
    }

    resolvedAccountId = account.id;
  } else if (policy === "manual") {
    if (!targetAccountId) {
      throw new AppError(
        status.BAD_REQUEST,
        "targetAccountId is required for manual policy"
      );
    }

    const account = await prisma.connectedAccount.findFirst({
      where: {
        id: targetAccountId,
        userId,
        status: "CONNECTED",
      },
    });

    if (!account) {
      throw new AppError(
        status.NOT_FOUND,
        "Connected account not found or disconnected"
      );
    }

    if (
      account.availableBytes !== null &&
      account.availableBytes < requiredBytes
    ) {
      throw new AppError(
        status.INSUFFICIENT_STORAGE,
        "Not enough storage space available in the selected account"
      );
    }

    resolvedAccountId = account.id;
  } else {
    resolvedAccountId = await pickBestAccount(userId, requiredBytes);
  }

  let resolvedDbFolderId: string | null = targetFolder?.id ?? null;
  let resolvedParentProviderFolderId: string;

  if (targetFolder?.connectedAccountId && targetFolder.providerFolderId) {
    resolvedParentProviderFolderId = targetFolder.providerFolderId;
  } else {
    const workspaceRoot = await resolveWorkspaceRootFolder(
      userId,
      resolvedAccountId
    );
    resolvedParentProviderFolderId = workspaceRoot.providerFolderId!;

    if (!resolvedDbFolderId) {
      resolvedDbFolderId = workspaceRoot.id;
    }
  }

  const session = await prisma.uploadSession.create({
    data: {
      userId,
      fileName,
      mimeType,
      size: requiredBytes,
      targetAccountId: resolvedAccountId,
      folderId: resolvedDbFolderId,
      status: "IN_PROGRESS",
    },
  });

  try {
    const adapter = await StorageAdapterFactory.getAdapter(
      userId,
      resolvedAccountId
    );

    onStreamStart?.();

    const uploaded = await adapter.uploadFile({
      name: fileName,
      mimeType,
      stream,
      size: requiredBytes,
      parentProviderFolderId: resolvedParentProviderFolderId,
    });

    const finalSize = uploaded.size
      ? Number(uploaded.size)
      : getByteCount
        ? getByteCount()
        : size;

    const fileRecord = await FileService.createFileRecord({
      name: uploaded.name,
      size: finalSize,
      mimeType: uploaded.mimeType,
      extension: fileName.includes(".") ? fileName.split(".").pop() : undefined,
      userId,
      folderId: resolvedDbFolderId,
      connectedAccountId: resolvedAccountId,
      providerFileId: uploaded.providerFileId,
      webContentLink: null,
      webViewLink: uploaded.webViewLink ?? null,
      thumbnailLink: uploaded.thumbnailLink ?? null,
    });

    await prisma.uploadSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        size: BigInt(finalSize),
      },
    });

    return fileRecord;
  } catch (error) {
    await prisma.uploadSession
      .update({
        where: { id: session.id },
        data: { status: "FAILED" },
      })
      .catch(() => undefined);
    throw error;
  }
};

export const UploadService = {
  uploadFile,
};