import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { ILoginUserPayload, IRegisterUserPayload } from "./auth.interface";
import { UserStatus } from "../../../generated/prisma/enums";
import { tokenUtils } from "../../utils/token";
import { prisma } from "../../lib/prisma";

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

export const AuthService = {
  registerUser,
  loginUser,
}