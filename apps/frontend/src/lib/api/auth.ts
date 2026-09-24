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

export type UpdateProfileInput = {
  name?: string;
  phone?: string;
};

type AuthData = { user: PublicUser };

export const authApi = {
  register: (data: RegisterInput) =>
    apiClient.post<{ message: string; userId: string }>("/api/auth/register", data),

  verifyEmail: (data: { email: string; otp: string }) =>
    apiClient.post<AuthData>("/api/auth/verify-email", data).then((d) => d.user),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>("/api/auth/forgot-password", { email }),

  resendOTP: (email: string) =>
    apiClient.post<{ message: string }>("/api/auth/resend-otp", { email }),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    apiClient.post<{ message: string }>("/api/auth/reset-password", data),

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

  updateProfile: (data: UpdateProfileInput) =>
    apiClient
      .patch<AuthData & { message: string }>("/api/auth/profile", data)
      .then((d) => d.user),
};
