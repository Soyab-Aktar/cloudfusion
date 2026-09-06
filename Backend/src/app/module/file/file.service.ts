import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { StorageAdapterFactory } from "../storage/storageAdapter.factory";
import {
  ICreateFileMetadata,
  IFileQueryFilters,
  IUpdateFileMetadata,
} from "./file.interface";

// 1. Create File Metadata Record
const createFileRecord = async (payload: ICreateFileMetadata) => {
  const {
    name,
    size,
    mimeType,
    extension,
    userId,
    folderId,
    connectedAccountId,
    providerFileId,
    webContentLink,
    webViewLink,
    thumbnailLink,
  } = payload;

  // Verify connected account belongs to user
  const account = await prisma.connectedAccount.findFirst({
    where: { id: connectedAccountId, userId },
  });
  if (!account) {
    throw new AppError(status.NOT_FOUND, "Connected account not found");
  }

  // If folderId is provided, verify folder exists and belongs to user
  if (folderId) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });
    if (!folder) {
      throw new AppError(status.NOT_FOUND, "Folder not found");
    }
  }

  const file = await prisma.file.create({
    data: {
      name,
      size: BigInt(size),
      mimeType,
      extension: extension ?? null,
      userId,
      folderId: folderId ?? null,
      connectedAccountId,
      provider: account.provider,
      providerFileId,
      webContentLink: webContentLink ?? null,
      webViewLink: webViewLink ?? null,
      thumbnailLink: thumbnailLink ?? null,
    },
    include: {
      connectedAccount: {
        select: {
          id: true,
          provider: true,
          email: true,
          displayName: true,
        },
      },
      folder: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return file;
};

// 2. Get User Files (with optional filtering)
const getUserFiles = async (userId: string, filters: IFileQueryFilters) => {
  const { folderId, connectedAccountId, mimeType, isFavorite, isTrash, search } = filters;

  const whereConditions: any = {
    userId,
    isTrash: isTrash !== undefined ? isTrash : false,
  };

  if (folderId !== undefined) {
    whereConditions.folderId = folderId ? folderId : null;
  }
  if (connectedAccountId) {
    whereConditions.connectedAccountId = connectedAccountId;
  }
  if (mimeType) {
    whereConditions.mimeType = { contains: mimeType, mode: "insensitive" };
  }
  if (isFavorite !== undefined) {
    whereConditions.isFavorite = isFavorite;
  }
  if (search) {
    whereConditions.name = { contains: search, mode: "insensitive" };
  }

  const files = await prisma.file.findMany({
    where: whereConditions,
    include: {
      connectedAccount: {
        select: {
          id: true,
          provider: true,
          email: true,
        },
      },
      folder: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return files;
};

// 3. Get Single File Details by ID
const getFileDetails = async (userId: string, fileId: string) => {
  const file = await prisma.file.findFirst({
    where: { id: fileId, userId },
    include: {
      connectedAccount: {
        select: {
          id: true,
          provider: true,
          email: true,
          displayName: true,
        },
      },
      folder: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!file) {
    throw new AppError(status.NOT_FOUND, "File not found");
  }

  return file;
};

// 4. Update File Metadata (Rename, Favorite, Trash)
const updateFileRecord = async (
  userId: string,
  fileId: string,
  payload: IUpdateFileMetadata
) => {
  const file = await prisma.file.findFirst({
    where: { id: fileId, userId },
  });

  if (!file) {
    throw new AppError(status.NOT_FOUND, "File not found");
  }

  const updatedFile = await prisma.file.update({
    where: { id: fileId },
    data: payload,
    include: {
      connectedAccount: {
        select: {
          id: true,
          provider: true,
          email: true,
        },
      },
    },
  });

  return updatedFile;
};

// 5. Toggle Favorite Status
const toggleFavoriteFile = async (userId: string, fileId: string) => {
  const file = await prisma.file.findFirst({
    where: { id: fileId, userId },
  });

  if (!file) {
    throw new AppError(status.NOT_FOUND, "File not found");
  }

  return prisma.file.update({
    where: { id: fileId },
    data: { isFavorite: !file.isFavorite },
  });
};

// 6. Soft Delete / Restore File (Toggle Trash)
const toggleTrashFile = async (userId: string, fileId: string) => {
  const file = await prisma.file.findFirst({
    where: { id: fileId, userId },
  });

  if (!file) {
    throw new AppError(status.NOT_FOUND, "File not found");
  }

  return prisma.file.update({
    where: { id: fileId },
    data: { isTrash: !file.isTrash },
  });
};

// 7. Permanently Delete File Record (DB & Cloud Storage)
const deleteFileRecord = async (userId: string, fileId: string) => {
  const file = await prisma.file.findFirst({
    where: { id: fileId, userId },
  });

  if (!file) {
    throw new AppError(status.NOT_FOUND, "File not found");
  }

  // Attempt physical file deletion from cloud drive via StorageAdapter
  if (file.connectedAccountId && file.providerFileId) {
    try {
      const adapter = await StorageAdapterFactory.getAdapter(
        userId,
        file.connectedAccountId
      );
      await adapter.deleteFile(file.providerFileId);
    } catch (error) {
      console.warn(
        "Failed to delete physical file from cloud storage, proceeding with DB delete:",
        error
      );
    }
  }

  // Delete virtual file record from database
  await prisma.file.delete({
    where: { id: fileId },
  });

  return null;
};

export const FileService = {
  createFileRecord,
  getUserFiles,
  getFileDetails,
  updateFileRecord,
  toggleFavoriteFile,
  toggleTrashFile,
  deleteFileRecord,
};
