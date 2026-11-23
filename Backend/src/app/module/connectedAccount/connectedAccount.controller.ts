import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { GoogleService } from "./google.service";
import { sendResponse } from "../../shared/sendResponse";
import { envVars } from "../../config/env";
import { ConnectedAccountService } from "./connectedAccount.service";
import crypto from "crypto";
import { cookieUtils } from "../../utils/cookie";
import { jwtUtils } from "../../utils/jwt";

const OAUTH_STATE_COOKIE = "google_oauth_state";
const OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: envVars.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

const connectGoogleAccount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "You are Unauthorized");
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  cookieUtils.setCookie(res, OAUTH_STATE_COOKIE, nonce, {
    ...OAUTH_COOKIE_OPTIONS,
    maxAge: 10 * 60 * 1000,
  });
  const stateToken = jwtUtils.createToken({ userId, nonce }, envVars.ACCESS_TOKEN_SECRET, {
    expiresIn: "10m",
  });

  const url = await GoogleService.getGoogleAuthUrl(stateToken);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Google Auth URL generated successfully",
    data: { url },
  })
})

const googleOAuthCallback = catchAsync(async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const error = req.query.error as string;

  const clearStateCookie = () => {
    cookieUtils.clearCookie(res, OAUTH_STATE_COOKIE, OAUTH_COOKIE_OPTIONS);
  };
  if (error) {
    clearStateCookie();
    return res.redirect(`${envVars.FRONTEND_URL}/dashboard?connect=cancelled`);
  }
  if (!code || !state) {
    clearStateCookie();
    throw new AppError(status.BAD_REQUEST, "Missing code or state parameter");
  }

  const storedNonce = cookieUtils.getCookie(req, OAUTH_STATE_COOKIE);
  clearStateCookie();

  const verifiedState = jwtUtils.verifyToken(state, envVars.ACCESS_TOKEN_SECRET);
  if (!verifiedState.success || !verifiedState.data) {
    throw new AppError(status.UNAUTHORIZED, "Invalid or expired OAuth state token");
  }
  const { userId, nonce } = verifiedState.data;
  if (!storedNonce || storedNonce !== nonce) {
    throw new AppError(status.FORBIDDEN, "Invalid OAuth state nonce: CSRF suspected");
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