import jwt from "jsonwebtoken";
import { env } from "../env";
import type { UserRole } from "../models/User";

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
