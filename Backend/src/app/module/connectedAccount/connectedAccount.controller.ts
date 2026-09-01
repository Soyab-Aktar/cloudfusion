import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { GoogleService } from "./google.service";
import { sendResponse } from "../../shared/sendResponse";
import { envVars } from "../../config/env";
import { ConnectedAccountService } from "./connectedAccount.service";

const connectGoogleAccount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "You are Unauthorized");
  }
  const url = await GoogleService.getGoogleAuthUrl(userId);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Google Auth URL generated successfully",
    data: { url },
  })
})

const googleOAuthCallback = catchAsync(async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const userId = req.query.state as string;
  if (!code || !userId) {
    throw new AppError(status.BAD_REQUEST, "Missing code or state parameter");
  }
  await GoogleService.handleGoogleCallback(code, userId);
  res.redirect(`${envVars.FRONTEND_URL}/dashboard?connect=success`);
})

const getUserConnectedAccounts = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "You are Unauthorized");
  }
  const result = await ConnectedAccountService.getUserConnectedAccounts(userId);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Connected accounts fetched successfully",
    data: result,
  });
})

const disconnectAccount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const accountId = req.params.id as string;
  if (!userId) throw new AppError(status.UNAUTHORIZED, "Unauthorized");
  await ConnectedAccountService.disconnectAccount(userId, accountId);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Account disconnected successfully",
    data: null,
  });
});

export const ConnectedAccountController = {
  connectGoogleAccount,
  googleOAuthCallback,
  getUserConnectedAccounts,
  disconnectAccount,
};