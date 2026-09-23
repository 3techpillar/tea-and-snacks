import { apiClient } from "../api-client";
import type { PublicUser } from "@tea-and-snacks/shared";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: "customer" | "vendor";
  vendorId?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export const authApi = {
  register: (data: RegisterInput) =>
    apiClient.post<PublicUser>("/api/auth/register", data),

  login: (data: LoginInput) =>
    apiClient.post<PublicUser>("/api/auth/login", data),

  logout: () =>
    apiClient.post<{ ok: boolean }>("/api/auth/logout"),

  me: () =>
    apiClient.get<PublicUser | null>("/api/auth/me"),
};
