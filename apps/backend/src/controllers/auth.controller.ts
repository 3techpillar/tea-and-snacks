import type { Request, Response, NextFunction } from "express";
import {
  registerUser,
  verifyEmail as verifyEmailService,
  resendOTP as resendOTPService,
  loginUser,
  forgotPassword as forgotPasswordService,
  resetPassword as resetPasswordService,
  refreshTokens,
  changePassword,
  updateProfile,
  logoutUser,
} from "../services/auth.service";
import { env } from "../config/env";
import { sendSuccess, sendCreated } from "../utils/response";
import { UnauthorizedError } from "../utils/errors";

const ACCESS_COOKIE = "easy_food_access";
const REFRESH_COOKIE = "easy_food_refresh";
const ACCESS_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    path: "/",
    maxAge: ACCESS_MAX_AGE_MS,
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    path: "/api/auth",
    maxAge: REFRESH_MAX_AGE_MS,
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await registerUser(req.body);
    sendCreated(res, result);
  } catch (err) {
    next(err);
  }
}

export async function resendOTP(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    const result = await resendOTPService(email);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, otp } = req.body;
    const { user, tokens } = await verifyEmailService(email, otp);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, tokens } = await loginUser(req.body);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      throw new UnauthorizedError("No refresh token provided.");
    }

    const { user, tokens } = await refreshTokens(token);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    sendSuccess(res, { user });
  } catch (err) {
    clearAuthCookies(res);
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.id) {
      await logoutUser(req.user.id);
    }
    clearAuthCookies(res);
    sendSuccess(res, { message: "Signed out successfully." });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response) {
  sendSuccess(res, { user: req.user ?? null });
}

export async function changePasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user?.id) {
      throw new UnauthorizedError();
    }
    const { user, tokens } = await changePassword(req.user.id, req.body);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    sendSuccess(res, { user, message: "Password changed successfully." });
  } catch (err) {
    next(err);
  }
}

export async function updateProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user?.id) {
      throw new UnauthorizedError();
    }
    const { user } = await updateProfile(req.user.id, req.body);
    sendSuccess(res, { user, message: "Profile updated successfully." });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email } = req.body;
    const result = await forgotPasswordService(email);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await resetPasswordService(email, otp, newPassword);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
