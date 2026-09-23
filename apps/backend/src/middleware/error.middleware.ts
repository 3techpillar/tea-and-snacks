import type { Request, Response, NextFunction } from "express";
import { AuthError } from "./auth.middleware";

/**
 * Global error handler — catches all errors thrown in controllers/services
 * and sends a consistent JSON error response.
 */
export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err);

  // Known auth errors carry their own status code
  if (err instanceof AuthError) {
    res.status(err.statusCode).json({ message: err.message, code: err.code });
    return;
  }

  // Zod validation errors
  if (err.name === "ZodError") {
    res.status(400).json({ message: "Validation failed", errors: err });
    return;
  }

  // Application-level errors thrown with `new Error(...)` in services
  // (e.g. "Invalid email or password.", "Product not found.", etc.)
  // are treated as 400 Bad Request to preserve the original behavior
  // where server functions returned these as user-facing messages.
  if (err.message && !err.message.includes("Cannot")) {
    res.status(400).json({ message: err.message });
    return;
  }

  // Unexpected errors
  res.status(500).json({ message: "Internal server error" });
}
