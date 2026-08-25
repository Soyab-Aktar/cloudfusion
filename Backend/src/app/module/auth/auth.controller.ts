import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { AuthService } from "./auth.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { tokenUtils } from "../../utils/token";
import AppError from "../../errorHelpers/AppError";
import { cookieUtils } from "../../utils/cookie";
import { envVars } from "../../config/env";

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

const verifyEmail = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await AuthService.verifyEmail(payload);
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Email Verified successfully",
      data: result
    })
  }
)

const logOutUser = catchAsync(
  async (req: Request, res: Response) => {
    const betterAuthSessionToken = req.cookies['better-auth.session_token'] || req.headers.authorization?.replace('Bearer ', '');
    const result = await AuthService.logOutUser(betterAuthSessionToken);

    const isProduction = envVars.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      secure: isProduction,
      path: "/",
    };

    cookieUtils.clearCookie(res, 'accessToken', cookieOptions);
    cookieUtils.clearCookie(res, 'refreshToken', cookieOptions);
    cookieUtils.clearCookie(res, 'better-auth.session_token', cookieOptions);

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Logout successfully",
      data: result
    })
  }
)

const changePassword = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;
    const betterAuthSessionToken = req.cookies['better-auth.session_token'] || req.headers.authorization?.replace('Bearer ', '');
    if (!betterAuthSessionToken) {
      throw new AppError(status.UNAUTHORIZED, "Session Token is Missing");
    }
    const result = await AuthService.changePassword(payload, betterAuthSessionToken);

    const { token, accessToken, refreshToken } = result;

    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    if (token) {
      tokenUtils.setBetterAuthSessionCookie(res, token as string);
    }

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Password Changed successfully",
      data: result
    })
  }
)

const forgotPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    await AuthService.forgotPassword(email);
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Email ,forgot password request send successfully",
    })
  }
)

const resetPassword = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;
    await AuthService.resetPassword(payload);
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Email-Password reset successfully",
    })
  }
)

export const AuthController = {
  registerUser, loginUser, getMe, getNewToken, verifyEmail,
  logOutUser, changePassword, forgotPassword, resetPassword,
}