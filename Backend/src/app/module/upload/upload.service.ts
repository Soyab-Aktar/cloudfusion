import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma"
import { IUploadFileInput } from "./upload.interface";
import { StorageAdapterFactory } from "../storage/storageAdapter.factory";
import { FileService } from "../file/file.service";

const pickBestAccount = async (userId: string): Promise<string> => {
  const accounts = await prisma.connectedAccount.findMany({
    where: {
      userId,
      status: "CONNECTED",
    }
  });

  if (accounts.length === 0) {
    throw new AppError(status.BAD_REQUEST, "No connected accounts found");
  }

  const best = accounts.sort((a, b) => {
    const aFree = a.availableBytes ?? BigInt(0);
    const bFree = b.availableBytes ?? BigInt(0);
    return bFree > aFree ? 1 : bFree < aFree ? -1 : 0;
  })[0];

  return best.id;
}

const uploadFile = async (input: IUploadFileInput) => {
  const {
    userId,
    fileName,
    mimeType,
    size,
    stream,
    folderId,
    parentProviderFolderId,
    policy,
    targetAccountId,
  } = input;

  let resolvedAccountId: string;

  if (policy === 'manual') {
    if (!targetAccountId) {
      throw new AppError(status.BAD_REQUEST, "targetAccountId is required for manual policy");
    }
    const account = await prisma.connectedAccount.findFirst({
      where: {
        id: targetAccountId,
        userId,
      }
    });
    if (!account) {
      throw new AppError(status.NOT_FOUND, "Connected account not found");
    }
    resolvedAccountId = targetAccountId;
  } else {
    resolvedAccountId = await pickBestAccount(userId);
  }

  const session = await prisma.uploadSession.create({
    data: {
      userId,
      fileName,
      mimeType,
      size: BigInt(size),
      targetAccountId: resolvedAccountId,
      folderId: folderId ?? null,
      status: "IN_PROGRESS",
    }
  });

  try {
    const adapter = await StorageAdapterFactory.getAdapter(userId, resolvedAccountId);

    const uploaded = await adapter.uploadFile({
      name: fileName,
      mimeType,
      stream,
      size: BigInt(size),
      parentProviderFolderId,
    })

    const fileRecord = await FileService.createFileRecord({
      name: uploaded.name,
      size: uploaded.size ? Number(uploaded.size) : size,
      mimeType: uploaded.mimeType,
      extension: fileName.includes(".") ? fileName.split(".").pop() : undefined,
      userId,
      folderId: folderId ?? null,
      connectedAccountId: resolvedAccountId,
      providerFileId: uploaded.providerFileId,
      webContentLink: null,
      webViewLink: uploaded.webViewLink ?? null,
      thumbnailLink: uploaded.thumbnailLink ?? null,
    });

    await prisma.uploadSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED" },
    });

    return fileRecord;
  } catch (error) {
    await prisma.uploadSession.update({
      where: { id: session.id },
      data: { status: "FAILED" },
    });
    throw error;
  }

};


export const UploadService = {
  uploadFile,
};