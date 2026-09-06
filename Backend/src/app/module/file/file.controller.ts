import { Request, Response } from "express";
import status from "http-status";
import { FileService } from "./file.service";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";

const createFile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await FileService.createFileRecord({
    ...req.body,
    userId: userId,
  });

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "File metadata record created successfully",
    data: result,
  });
});

const getUserFiles = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const filters = {
    folderId: req.query.folderId as string | undefined,
    connectedAccountId: req.query.connectedAccountId as string | undefined,
    mimeType: req.query.mimeType as string | undefined,
    isFavorite:
      req.query.isFavorite !== undefined
        ? req.query.isFavorite === "true"
        : undefined,
    isTrash:
      req.query.isTrash !== undefined
        ? req.query.isTrash === "true"
        : undefined,
    search: req.query.search as string | undefined,
  };

  const result = await FileService.getUserFiles(userId, filters);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User files retrieved successfully",
    data: result,
  });
});

const getFileDetails = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const fileId = req.params.id as string;
  const result = await FileService.getFileDetails(userId, fileId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "File details retrieved successfully",
    data: result,
  });
});

const updateFile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const fileId = req.params.id as string;
  const result = await FileService.updateFileRecord(userId, fileId, req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "File metadata updated successfully",
    data: result,
  });
});

const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const fileId = req.params.id as string;
  const result = await FileService.toggleFavoriteFile(userId, fileId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: `File ${result.isFavorite ? "starred" : "unstarred"} successfully`,
    data: result,
  });
});

const toggleTrash = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const fileId = req.params.id as string;
  const result = await FileService.toggleTrashFile(userId, fileId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: `File ${result.isTrash ? "moved to trash" : "restored from trash"
      } successfully`,
    data: result,
  });
});

const deleteFile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const fileId = req.params.id as string;
  await FileService.deleteFileRecord(userId, fileId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "File deleted successfully",
    data: null,
  });
});

export const FileController = {
  createFile,
  getUserFiles,
  getFileDetails,
  updateFile,
  toggleFavorite,
  toggleTrash,
  deleteFile,
};
