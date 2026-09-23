import { setCookie, deleteCookie } from "@tanstack/react-start/server";
import { env } from "../env";

export const AUTH_COOKIE = "easy_food_token";
export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function setAuthCookie(token: string) {
  setCookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    path: "/",
    maxAge: AUTH_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookie() {
  deleteCookie(AUTH_COOKIE, { path: "/" });
}
