import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  errorInstance: Error,
  request: Request,
  response: Response,
  nextFunction: NextFunction
): void => {
  console.error("Unhandled Application Error:", errorInstance);

  const statusCode = response.statusCode && response.statusCode !== 200 ? response.statusCode : 500;

  response.status(statusCode).json({
    success: false,
    message: errorInstance.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : errorInstance.stack,
  });
};
