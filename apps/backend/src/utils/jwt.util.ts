import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { UserRole } from "@tea-and-snacks/shared";

export type AuthTokenPayload = {
  sub: string;
  role: UserRole;
  vendorId?: string;
};

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
  } catch {
    return null;
  }
}
