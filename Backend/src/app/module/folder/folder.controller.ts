import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { FolderService } from "./folder.service";

const createFolder = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "You are Unauthorized");
  }

  const { name, parentId, connectedAccountId } = req.body;
  if (!name) {
    throw new AppError(status.BAD_REQUEST, "Folder name is required");
  }

  const result = await FolderService.createFolder({
    userId,
    name,
    parentId,
    connectedAccountId,
  });

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Folder created successfully",
    data: result,
  });
});

const getUserFolders = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "You are Unauthorized");
  }

  const parentId = req.query.parentId as string | undefined;
  const result = await FolderService.getUserFolders(userId, parentId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Folders retrieved successfully",
    data: result,
  });
});

const getFolderDetails = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const id = req.params.id as string;

  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "You are Unauthorized");
  }

  const result = await FolderService.getFolderDetails(userId, id);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Folder details retrieved successfully",
    data: result,
  });
});

const renameFolder = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const id = req.params.id as string;
  const { name } = req.body;

  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "You are Unauthorized");
  }
  if (!name) {
    throw new AppError(status.BAD_REQUEST, "New folder name is required");
  }

  const result = await FolderService.renameFolder({
    userId,
    folderId: id,
    newName: name,
  });

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Folder renamed successfully",
    data: result,
  });
});

const deleteFolder = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const id = req.params.id as string;

  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "You are Unauthorized");
  }

  await FolderService.deleteFolder(userId, id);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Folder deleted successfully",
    data: null,
  });
});

export const FolderController = {
  createFolder,
  getUserFolders,
  getFolderDetails,
  renameFolder,
  deleteFolder,
};
