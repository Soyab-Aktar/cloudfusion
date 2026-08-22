import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { ILoginUserPayload, IRegisterUserPayload } from "./auth.interface";
import { UserStatus } from "../../../generated/prisma/enums";
import { tokenUtils } from "../../utils/token";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { jwtUtils } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";

const registerUser = async (payload: IRegisterUserPayload) => {
  const { name, email, password } = payload;
  const data = await auth.api.signUpEmail({
    body: {
      name, email, password,
    }
  });
  if (!data.user) {
    throw new AppError(status.BAD_REQUEST, "Failed to Register User");
  }
  const accessToken = tokenUtils.getAccessToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
  })
  const refreshToken = tokenUtils.getRefreshToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
  })

  return {
    ...data,
    accessToken,
    refreshToken
  }
}

const loginUser = async (payload: ILoginUserPayload) => {
  const { email, password } = payload;

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  if (existingUser?.status === UserStatus.BLOCKED) {
    throw new AppError(status.FORBIDDEN, "User is blocked");
  }
  if (!existingUser || existingUser.isDeleted || existingUser.status === UserStatus.DELETED) {
    throw new AppError(status.NOT_FOUND, "User is deleted or not found");
  }

  const data = await auth.api.signInEmail({
    body: { email, password }
  });
  const accessToken = tokenUtils.getAccessToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
  })
  const refreshToken = tokenUtils.getRefreshToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
  })

  return {
    ...data,
    accessToken,
    refreshToken
  }
}

const getMe = async (user: IRequestUser) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      email: user.email
    }
  })
  if (!isUserExists) {
    throw new AppError(status.NOT_FOUND, "User not exits");
  }
  return isUserExists;
}

const getNewToken = async (refreshToken: string, sessionToken: string) => {
  const cleanSessionToken = sessionToken.split('.')[0];

  const isSessionTokenExists = await prisma.session.findUnique({
    where: {
      token: cleanSessionToken,
    },
    include: {
      user: true,
    },
  });

  if (!isSessionTokenExists) {
    throw new AppError(status.UNAUTHORIZED, "Invalid or expired session token");
  }

  const user = isSessionTokenExists.user;

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(status.FORBIDDEN, "User is blocked");
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(status.NOT_FOUND, "User is deleted");
  }

  const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, envVars.REFRESH_TOKEN_SECRET);

  if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
    throw new AppError(status.UNAUTHORIZED, "Invalid or expired refresh token");
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const newAccessToken = tokenUtils.getAccessToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified,
  });

  const newRefreshToken = tokenUtils.getRefreshToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified,
  });


  const updatedSessionToken = await prisma.session.update({
    where: {
      token: cleanSessionToken,
    },
    data: {
      expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000),
      updatedAt: new Date(),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionToken: updatedSessionToken.token,
  };
};


export const AuthService = {
  registerUser,
  loginUser,
  getMe,
  getNewToken,
}