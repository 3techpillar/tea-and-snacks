import type { Request, Response, NextFunction } from "express";
import { connectDB } from "../config/db";
import { User, toPublicUser, type PublicUser } from "../models/User.model";
import { verifyAccessToken } from "../utils/jwt.util";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import {
  hasPermission,
  type Permission,
  type UserRole,
} from "@tea-and-snacks/shared";

const ACCESS_COOKIE = "easy_food_access";

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser | null;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token =
      req.cookies?.[ACCESS_COOKIE] ||
      req.headers.authorization?.replace("Bearer ", "");

    const payload = token ? verifyAccessToken(token) : null;
    if (!payload) {
      req.user = null;
      return next();
    }

    await connectDB();
    const user = await User.findById(payload.sub);

    if (!user) {
      req.user = null;
      return next();
    }

    if (user.tokenVersion !== undefined && user.tokenVersion !== payload.v) {
      req.user = null;
      return next();
    }

    if (user.isActive === false) {
      req.user = null;
      return next();
    }

    req.user = toPublicUser(user);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireUser(user: PublicUser | null | undefined): PublicUser {
  if (!user)
    throw new UnauthorizedError("You need to sign in first.");
  return user;
}

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = requireUser(req.user);
    if (!hasPermission(user.role as UserRole, ...permissions)) {
      throw new ForbiddenError(
        "You do not have permission to perform this action.",
      );
    }
    next();
  };
}

export function requireVendor(
  user: PublicUser | null | undefined,
): PublicUser & { vendorId: string } {
  const u = requireUser(user);
  if (u.role !== "vendor" || !u.vendorId) {
    throw new ForbiddenError("This action is vendor-only.");
  }
  return u as PublicUser & { vendorId: string };
}

export function requireVendorAccess(
  user: PublicUser | null | undefined,
  vendorId: string,
): PublicUser {
  const u = requireUser(user);
  if (u.role === "admin") return u;
  if (u.role === "vendor" && u.vendorId === vendorId) return u;
  throw new ForbiddenError("You can only manage your own stall.");
}

export function requireAdmin(user: PublicUser | null | undefined): PublicUser {
  const u = requireUser(user);
  if (u.role !== "admin") {
    throw new ForbiddenError("This action is admin-only.");
  }
  return u;
}
