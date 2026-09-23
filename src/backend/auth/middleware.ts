import { createMiddleware } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { connectDB } from "../db";
import { User, toPublicUser, type PublicUser } from "../models/User";
import { AUTH_COOKIE } from "./cookie";
import { verifyAuthToken } from "./jwt";

/** Attaches `context.user` (PublicUser | null) to every server fn that uses it. */
export const authMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const token = getCookie(AUTH_COOKIE);
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload) return next({ context: { user: null as PublicUser | null } });

    await connectDB();
    const user = await User.findById(payload.sub);
    return next({ context: { user: user ? toPublicUser(user) : null } });
  },
);

export class AuthError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHENTICATED" | "FORBIDDEN",
  ) {
    super(message);
  }
}

export function requireUser(user: PublicUser | null): PublicUser {
  if (!user)
    throw new AuthError("You need to sign in first.", "UNAUTHENTICATED");
  return user;
}

export function requireVendor(
  user: PublicUser | null,
): PublicUser & { vendorId: string } {
  const u = requireUser(user);
  if (u.role !== "vendor" || !u.vendorId) {
    throw new AuthError("This action is vendor-only.", "FORBIDDEN");
  }
  return u as PublicUser & { vendorId: string };
}

/** Only the vendor who owns `vendorId` (or an admin) may act on that stall's dashboard. */
export function requireVendorAccess(
  user: PublicUser | null,
  vendorId: string,
): PublicUser {
  const u = requireUser(user);
  if (u.role === "admin") return u;
  if (u.role === "vendor" && u.vendorId === vendorId) return u;
  throw new AuthError("You can only manage your own stall.", "FORBIDDEN");
}

export function requireAdmin(user: PublicUser | null): PublicUser {
  const u = requireUser(user);
  if (u.role !== "admin") {
    throw new AuthError("This action is admin-only.", "FORBIDDEN");
  }
  return u;
}
