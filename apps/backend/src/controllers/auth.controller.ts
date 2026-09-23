import type { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "../services/auth.service";
import { env } from "../config/env";

const AUTH_COOKIE = "easy_food_token";
const AUTH_MAX_AGE_MS = 60 * 60 * 24 * 7 * 1000; // 7 days

function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    path: "/",
    maxAge: AUTH_MAX_AGE_MS,
  });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await registerUser(req.body);
    setAuthCookie(res, token);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await loginUser(req.body);
    setAuthCookie(res, token);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
  res.json({ ok: true });
}

export async function me(req: Request, res: Response) {
  res.json(req.user ?? null);
}
