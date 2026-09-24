import type { Response } from "express";

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
): void {
  res.status(statusCode).json({ success: true, data } satisfies ApiSuccessResponse<T>);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}
