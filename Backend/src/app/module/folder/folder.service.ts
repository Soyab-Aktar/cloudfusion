import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { ICreateFolder, IRenameFolder } from "./folder.interface";
import { StorageAdapterFactory } from "../storage/storageAdapter.factory";

const createFolder = async (payload: ICreateFolder) => {
  const { userId, name, parentId, connectedAccountId } = payload;
  let providerFolderId: string | undefined = undefined;

  if (parentId) {
    const parentFolder = await prisma.folder.findFirst({
      where: {
        id: parentId,
        userId: userId,
      },
    });
    if (!parentFolder) {
      throw new AppError(status.NOT_FOUND, "Parent folder not found");
    }
  }

  if (connectedAccountId) {
    const adapter = await StorageAdapterFactory.getAdapter(userId, connectedAccountId);
    let parentProviderFolderId: string | undefined = undefined;
    if (parentId) {
      const parentFolder = await prisma.folder.findUnique({
        where: { id: parentId },
      });
      parentProviderFolderId = parentFolder?.providerFolderId ?? undefined;
    }
    const cloudFolder = await adapter.createFolder(name, parentProviderFolderId);
    providerFolderId = cloudFolder.providerFileId;
  }

  const folder = await prisma.folder.create({
    data: {
      name,
      userId,
      parentId: parentId || null,
      connectedAccountId: connectedAccountId || null,
      providerFolderId: providerFolderId || null,
    },
    include: {
      connectedAccount: {
        select: {
          id: true,
          provider: true,
          email: true,
          displayName: true,
        }
      }
    }
  });

  return folder;
}

const getUserFolders = async (userId: string, parentId?: string) => {
  const folders = await prisma.folder.findMany({
    where: {
      userId,
      parentId: parentId ? parentId : null,
      isTrash: false,
    },
    include: {
      connectedAccount: {
        select: {
          id: true,
          provider: true,
          email: true,
        },
      },
      _count: {
        select: {
          files: true,
          children: true,
        }
      }
    },
    orderBy: {
      name: 'asc',
    }
  });
  return folders;
}

const getFolderDetails = async (userId: string, folderId: string) => {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId, isTrash: false },
    include: {
      children: {
        where: { isTrash: false },
        orderBy: { name: "asc" },
      },
      files: {
        where: { isTrash: false },
        orderBy: { name: "asc" },
      },
      connectedAccount: {
        select: { id: true, provider: true, email: true },
      },
    },
  });
  if (!folder) {
    throw new AppError(status.NOT_FOUND, "Folder not found");
  }
  return folder;
};

const renameFolder = async (payload: IRenameFolder) => {
  const { userId, folderId, newName } = payload;

  const folder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      userId
    },
  });
  if (!folder) {
    throw new AppError(status.NOT_FOUND, "Folder not found");
  }

  const updatedFolder = await prisma.folder.update({
    where: {
      id: folderId
    },
    data: {
      name: newName
    }
  });
  return updatedFolder;
}

const deleteFolder = async (userId: string, folderId: string) => {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
  });
  if (!folder) {
    throw new AppError(status.NOT_FOUND, "Folder not found");
  }
  // Delete physical cloud folder if linked
  if (folder.connectedAccountId && folder.providerFolderId) {
    try {
      const adapter = await StorageAdapterFactory.getAdapter(userId, folder.connectedAccountId);
      await adapter.deleteFile(folder.providerFolderId);
    } catch (error) {
      console.warn("Failed to delete physical folder in cloud, continuing DB delete:", error);
    }
  }
  // Delete virtual folder from database
  await prisma.folder.delete({
    where: { id: folderId },
  });

  return null;
};

export const FolderService = {
  createFolder,
  getUserFolders,
  getFolderDetails,
  renameFolder,
  deleteFolder,
};
