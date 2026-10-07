import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import status from "http-status";
import { envVars } from "../config/env";
import { Prisma } from "../../generated/prisma/client";
import AppError from "../errorHelpers/AppError";
import { handleZodError } from "../errorHelpers/handleZodError";
import {
  handlePrismaClientKnownRequestError,
  handlePrismaClientUnknownError,
  handlePrismaClientValidationError,
  handlePrismaClientInitializationError,
  handlePrismaClientRustPanicError,
} from "../errorHelpers/handlePrismaErrors";
import { TErrorSources } from "../interfaces/error.interface";

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message: string = "Something went wrong!";
  let errorSources: TErrorSources[] = [];

  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode || status.BAD_REQUEST;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const simplifiedError = handlePrismaClientKnownRequestError(err);
    statusCode = simplifiedError.statusCode || status.BAD_REQUEST;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    const simplifiedError = handlePrismaClientValidationError(err);
    statusCode = simplifiedError.statusCode || status.BAD_REQUEST;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    const simplifiedError = handlePrismaClientInitializationError(err);
    statusCode = simplifiedError.statusCode || status.SERVICE_UNAVAILABLE;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    const simplifiedError = handlePrismaClientRustPanicError();
    statusCode = simplifiedError.statusCode || status.INTERNAL_SERVER_ERROR;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    const simplifiedError = handlePrismaClientUnknownError(err);
    statusCode = simplifiedError.statusCode || status.INTERNAL_SERVER_ERROR;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [
      {
        path: "",
        message: err.message,
      },
    ];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [
      {
        path: "",
        message: err.message,
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    ...(envVars.NODE_ENV === "development" && { stack: err?.stack }),
  });
};
