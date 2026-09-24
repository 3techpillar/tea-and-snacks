import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { UserRole } from "@tea-and-snacks/shared";

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
  vendorId?: string;
  /** Matches User.tokenVersion — allows forced invalidation. */
  v: number;
};

export type RefreshTokenPayload = {
  sub: string;
  /** Matches User.tokenVersion — allows forced invalidation. */
  v: number;
  type: "refresh";
};

export function signAccessToken(payload: Omit<AccessTokenPayload, never>): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "refresh" },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions["expiresIn"] },
  );
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
    if (decoded.type !== "refresh") return null;
    return decoded;
  } catch {
    return null;
  }
}

export type AuthTokenPayload = AccessTokenPayload;

export function signAuthToken(payload: {
  sub: string;
  role: UserRole;
  vendorId?: string;
}): string {
  return signAccessToken({ ...payload, v: 0 });
}

export function verifyAuthToken(token: string): AccessTokenPayload | null {
  return verifyAccessToken(token);
}
