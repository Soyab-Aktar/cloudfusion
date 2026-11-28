import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { GoogleService } from "../connectedAccount/google.service";
import { StorageAdapterFactory } from "../storage/storageAdapter.factory";
import { ICreateFolder, IRenameFolder } from "./folder.interface";

/**
 * Collects the target folder ID plus all nested descendant folder IDs
 * so deleting a folder moves its entire subtree to Trash.
 */
const collectSubtreeFolderIds = async (
  userId: string,
  rootFolderId: string
): Promise<string[]> => {
  const allIds: string[] = [rootFolderId];
  let frontier: string[] = [rootFolderId];

  while (frontier.length > 0) {
    const children = await prisma.folder.findMany({
      where: {
        userId,
        parentId: { in: frontier },
        isTrash: false,
      },
      select: { id: true },
    });

    frontier = children.map((c) => c.id);
    allIds.push(...frontier);
  }

  return allIds;
};

const createFolder = async (payload: ICreateFolder) => {
  const { userId, name, parentId } = payload;
  let resolvedAccountId: string | null = payload.connectedAccountId || null;
  let providerFolderId: string | undefined = undefined;
  let targetParentDbId: string | null = parentId || null;
  let targetParentProviderId: string | undefined = undefined;

  // 1. Validate explicit parentId if provided
  if (parentId) {
    const parentFolder = await prisma.folder.findFirst({
      where: { id: parentId, userId, isTrash: false },
    });

    if (!parentFolder) {
      throw new AppError(status.NOT_FOUND, "Parent folder not found");
    }

    // If parent is a Physical Folder, child must belong to the same drive
    if (parentFolder.connectedAccountId) {
      if (
        resolvedAccountId &&
        resolvedAccountId !== parentFolder.connectedAccountId
      ) {
        throw new AppError(
          status.BAD_REQUEST,
          "Cannot create a folder for a different drive inside a physical folder"
        );
      }
      resolvedAccountId = parentFolder.connectedAccountId;
      targetParentProviderId = parentFolder.providerFolderId ?? undefined;
    }

    targetParentDbId = parentFolder.id;
  }

  // 2. If creating a Physical Folder, verify account & ensure Drive parent exists
  if (resolvedAccountId) {
    const account = await prisma.connectedAccount.findFirst({
      where: {
        id: resolvedAccountId,
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

    // Ensure physical folders without a physical parent land in "CloudFusion Workspace"
    if (!targetParentProviderId) {
      let rootWorkspace = await prisma.folder.findFirst({
        where: {
          userId,
          connectedAccountId: resolvedAccountId,
          isRoot: true,
          isTrash: false,
        },
      });

      if (!rootWorkspace || !rootWorkspace.providerFolderId) {
        rootWorkspace = await GoogleService.ensureGoogleAppFolder(resolvedAccountId);
      }

      if (!rootWorkspace?.providerFolderId) {
        throw new AppError(
          status.INTERNAL_SERVER_ERROR,
          "Failed to resolve CloudFusion Workspace root folder"
        );
      }

      targetParentProviderId = rootWorkspace.providerFolderId;
      if (!targetParentDbId) {
        targetParentDbId = rootWorkspace.id;
      }
    }

    // 3. Create the physical folder in the cloud
    const adapter = await StorageAdapterFactory.getAdapter(
      userId,
      resolvedAccountId
    );
    const cloudFolder = await adapter.createFolder(name, targetParentProviderId);
    providerFolderId = cloudFolder.providerFileId;
  }

  // 4. Save to PostgreSQL
  const folder = await prisma.folder.create({
    data: {
      name,
      userId,
      parentId: targetParentDbId,
      connectedAccountId: resolvedAccountId,
      providerFolderId: providerFolderId || null,
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
    },
  });

  return folder;
};

const getUserFolders = async (
  userId: string,
  parentId?: string,
  search?: string
) => {
  const whereConditions: any = {
    userId,
    isTrash: false,
  };

  if (search) {
    whereConditions.name = { contains: search, mode: "insensitive" };
  } else if (parentId !== undefined) {
    whereConditions.parentId = parentId ? parentId : null;
  }

  const folders = await prisma.folder.findMany({
    where: whereConditions,
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
          files: { where: { isTrash: false } },
          children: { where: { isTrash: false } },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return folders;
};

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
      userId,
      isTrash: false,
    },
  });

  if (!folder) {
    throw new AppError(status.NOT_FOUND, "Folder not found");
  }

  if (folder.isRoot) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot rename the root workspace folder"
    );
  }

  if (folder.connectedAccountId && folder.providerFolderId) {
    try {
      const adapter = await StorageAdapterFactory.getAdapter(
        userId,
        folder.connectedAccountId
      );
      await adapter.renameFile(folder.providerFolderId, newName);
    } catch (err) {
      console.warn(
        "Failed to rename physical folder in cloud, continuing DB rename:",
        err
      );
    }
  }

  const updatedFolder = await prisma.folder.update({
    where: { id: folderId },
    data: { name: newName },
  });

  return updatedFolder;
};

const deleteFolder = async (userId: string, folderId: string) => {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId, isTrash: false },
  });

  if (!folder) {
    throw new AppError(status.NOT_FOUND, "Folder not found");
  }

  if (folder.isRoot) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot delete the root workspace folder"
    );
  }

  // Collect this folder and all nested subfolders
  const subtreeIds = await collectSubtreeFolderIds(userId, folderId);

  // Move the folder subtree and all contained files to Trash in one transaction
  await prisma.$transaction([
    prisma.file.updateMany({
      where: {
        userId,
        folderId: { in: subtreeIds },
        isTrash: false,
      },
      data: {
        isTrash: true,
      },
    }),
    prisma.folder.updateMany({
      where: {
        userId,
        id: { in: subtreeIds },
      },
      data: {
        isTrash: true,
      },
    }),
  ]);

  return null;
};

export const FolderService = {
  createFolder,
  getUserFolders,
  getFolderDetails,
  renameFolder,
  deleteFolder,
};