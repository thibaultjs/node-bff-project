import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let status = "error";
  let message = "Internal Server Error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    status = err.status;
    message = err.message;
  } else {
    console.error("UNKNOWN ERROR", err); // Log for developer
  }

  res.status(statusCode).json({
    status,
    message,
    stack: env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
