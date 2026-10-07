import status from "http-status";
import z from "zod";
import { TErrorResponse, TErrorSources } from "../interfaces/error.interface";

export const handleZodError = (error: z.ZodError): TErrorResponse => {
  const statusCode = status.BAD_REQUEST;
  const message = "Zod Validation Error";
  const errorSources: TErrorSources[] = [];
  error.issues.forEach(issue => {
    errorSources.push({
      path: issue.path.length > 0 ? issue.path.join(".") : "root",
      message: issue.message,
    });
  })

  return {
    success: false,
    message,
    errorSources,
    statusCode
  }
}