import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import status from "http-status";
import AppError from "./AppError";
import { envVars } from "../config/env";
import { Prisma } from "../../generated/prisma/client";

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message: string = "Something went wrong!";
  let errorSources: any = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [
      {
        path: "",
        message: err.message,
      },
    ];
  } else if (err instanceof ZodError) {
    statusCode = status.BAD_REQUEST;
    message = "Validation Error";
    errorSources = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = status.BAD_REQUEST;
    message = `Database Error: ${err.code}`;
    errorSources = [
      {
        path: err.meta?.target ? String(err.meta.target) : "",
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
