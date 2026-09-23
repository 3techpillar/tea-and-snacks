import type { Request, Response, NextFunction } from "express";
import { connectDB } from "../config/db";
import { User, toPublicUser, type PublicUser } from "../models/User.model";
import { verifyAuthToken } from "../utils/jwt.util";

const AUTH_COOKIE = "easy_food_token";

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: PublicUser | null;
    }
  }
}

/**
 * Reads the JWT from the httpOnly cookie (or Authorization header) and
 * attaches `req.user` (PublicUser | null) to the request.
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token =
      req.cookies?.[AUTH_COOKIE] ||
      req.headers.authorization?.replace("Bearer ", "");

    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) {
      req.user = null;
      return next();
    }

    await connectDB();
    const user = await User.findById(payload.sub);
    req.user = user ? toPublicUser(user) : null;
    next();
  } catch (err) {
    next(err);
  }
}

// ── Authorization helpers ──────────────────────────────────────────

export class AuthError extends Error {
  statusCode: number;
  constructor(
    message: string,
    public code: "UNAUTHENTICATED" | "FORBIDDEN",
  ) {
    super(message);
    this.statusCode = code === "UNAUTHENTICATED" ? 401 : 403;
  }
}

export function requireUser(user: PublicUser | null | undefined): PublicUser {
  if (!user)
    throw new AuthError("You need to sign in first.", "UNAUTHENTICATED");
  return user;
}

export function requireVendor(
  user: PublicUser | null | undefined,
): PublicUser & { vendorId: string } {
  const u = requireUser(user);
  if (u.role !== "vendor" || !u.vendorId) {
    throw new AuthError("This action is vendor-only.", "FORBIDDEN");
  }
  return u as PublicUser & { vendorId: string };
}

/** Only the vendor who owns `vendorId` (or an admin) may act on that stall's dashboard. */
export function requireVendorAccess(
  user: PublicUser | null | undefined,
  vendorId: string,
): PublicUser {
  const u = requireUser(user);
  if (u.role === "admin") return u;
  if (u.role === "vendor" && u.vendorId === vendorId) return u;
  throw new AuthError("You can only manage your own stall.", "FORBIDDEN");
}

export function requireAdmin(user: PublicUser | null | undefined): PublicUser {
  const u = requireUser(user);
  if (u.role !== "admin") {
    throw new AuthError("This action is admin-only.", "FORBIDDEN");
  }
  return u;
}
