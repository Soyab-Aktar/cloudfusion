import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { ILoginUserPayload, IRegisterUserPayload } from "./auth.interface";
import { UserStatus } from "../../../generated/prisma/enums";

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

  return data;
}

const loginUser = async (payload: ILoginUserPayload) => {
  const { email, password } = payload;
  const data = await auth.api.signInEmail({
    body: {
      email, password
    }
  });
  if (data.user.status === UserStatus.BLOCKED) {
    throw new AppError(status.FORBIDDEN, "User is blocked");
  }

  if (data.user.isDeleted || data.user.status === UserStatus.DELETED) {
    throw new AppError(status.NOT_FOUND, "User is deleted");
  }

  return data;
}

export const AuthService = {
  registerUser,
  loginUser,
}