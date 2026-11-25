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

const getSafeProductionMessage = (statusCode: number): string => {
  switch (statusCode) {
    case status.CONFLICT:
      return "A record with this value already exists.";
    case status.NOT_FOUND:
      return "The requested resource was not found.";
    case status.BAD_REQUEST:
      return "Invalid request data.";
    case status.TOO_MANY_REQUESTS:
      return "Too many requests. Please try again later.";
    case status.SERVICE_UNAVAILABLE:
    case status.GATEWAY_TIMEOUT:
      return "Service is temporarily unavailable. Please try again.";
    default:
      return "Something went wrong!";
  }
};

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const isProduction = envVars.NODE_ENV === "production";

  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message: string = "Something went wrong!";
  let errorSources: TErrorSources[] = [];
  let isInternalError = false;

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
    isInternalError = true;
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    const simplifiedError = handlePrismaClientValidationError(err);
    statusCode = simplifiedError.statusCode || status.BAD_REQUEST;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
    isInternalError = true;
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    const simplifiedError = handlePrismaClientInitializationError(err);
    statusCode = simplifiedError.statusCode || status.SERVICE_UNAVAILABLE;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
    isInternalError = true;
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    const simplifiedError = handlePrismaClientRustPanicError();
    statusCode = simplifiedError.statusCode || status.INTERNAL_SERVER_ERROR;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
    isInternalError = true;
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    const simplifiedError = handlePrismaClientUnknownError(err);
    statusCode = simplifiedError.statusCode || status.INTERNAL_SERVER_ERROR;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
    isInternalError = true;
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
    isInternalError = true;
  }

  if (isInternalError || statusCode >= 500) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  if (isProduction && isInternalError) {
    const safeMessage = getSafeProductionMessage(statusCode);
    message = safeMessage;
    errorSources = [{ path: "", message: safeMessage }];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    ...(!isProduction && { stack: err?.stack }),
  });
};