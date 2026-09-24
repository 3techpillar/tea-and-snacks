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

export type ChangePasswordInput = {
  oldPassword: string;
  newPassword: string;
};

type AuthData = { user: PublicUser };

export const authApi = {
  register: (data: RegisterInput) =>
    apiClient.post<AuthData>("/api/auth/register", data).then((d) => d.user),

  login: (data: LoginInput) =>
    apiClient.post<AuthData>("/api/auth/login", data).then((d) => d.user),

  logout: () => apiClient.post<{ message: string }>("/api/auth/logout"),

  me: () =>
    apiClient
      .get<{ user: PublicUser | null }>("/api/auth/me")
      .then((d) => d.user),

  refresh: () =>
    apiClient.post<AuthData>("/api/auth/refresh").then((d) => d.user),

  changePassword: (data: ChangePasswordInput) =>
    apiClient
      .post<AuthData & { message: string }>("/api/auth/change-password", data)
      .then((d) => d.user),
};
