import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { AuthService } from "./auth.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { tokenUtils } from "../../utils/token";
import AppError from "../../errorHelpers/AppError";

const registerUser = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await AuthService.registerUser(payload);
    const { accessToken, refreshToken, token, user } = result;
    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, token as string);
    sendResponse(res, {
      httpStatusCode: status.CREATED,
      success: true,
      message: "User Registered successfully",
      data: {
        token, accessToken, refreshToken, user
      }
    })
  }
)

const loginUser = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await AuthService.loginUser(payload);
    const { accessToken, refreshToken, token, user } = result;
    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, token as string);
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "User logged in successfully",
      data: {
        token, accessToken, refreshToken, user
      }
    })
  }
)

const getMe = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;
    const result = await AuthService.getMe(user);
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "User profile fetched successfully",
      data: result
    })
  }
)

const getNewToken = catchAsync(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    const betterAuthSessionToken = req.cookies["better-auth.session_token"];
    if (!refreshToken) {
      throw new AppError(status.UNAUTHORIZED, "Refresh Token is Missing");
    }
    if (!betterAuthSessionToken) {
      throw new AppError(status.UNAUTHORIZED, "Session Token is Missing");
    }
    const result = await AuthService.getNewToken(refreshToken, betterAuthSessionToken);
    const { accessToken, refreshToken: newRefreshToken, sessionToken } = result;

    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, newRefreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, sessionToken)

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "New Token Generated",
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        sessionToken,
      },
    })
  }
)

export const AuthController = {
  registerUser, loginUser, getMe, getNewToken,
}