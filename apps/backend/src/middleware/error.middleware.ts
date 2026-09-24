import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { env } from "../config/env";

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err.name === "ZodError") {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: err,
      },
    });
    return;
  }

  if ((err as any).code === 11000) {
    res.status(409).json({
      success: false,
      error: {
        code: "CONFLICT",
        message: "A resource with that identifier already exists.",
      },
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: env.isProd
        ? "Internal server error"
        : err.message || "Internal server error",
    },
  });
}
