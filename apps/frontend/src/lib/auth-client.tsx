import { createContext, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, type ChangePasswordInput, type UpdateProfileInput } from "@/lib/api/auth";
import type { PublicUser, UserRole } from "@tea-and-snacks/shared";
import { hasPermission, type Permission } from "@tea-and-snacks/shared";

export type CurrentUser = PublicUser | null;

const AUTH_QUERY_KEY = ["auth", "me"] as const;

type AuthContextValue = {
  user: CurrentUser;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: { email: string; password: string }) => Promise<CurrentUser>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: "customer" | "vendor";
    vendorId?: string;
  }) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  changePassword: (input: ChangePasswordInput) => Promise<CurrentUser>;
  updateProfile: (input: UpdateProfileInput) => Promise<CurrentUser>;
  refreshSession: () => Promise<CurrentUser>;
  checkPermission: (...permissions: Permission[]) => boolean;
  loginError: string | null;
  registerError: string | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchCurrentUser(): Promise<CurrentUser> {
  const user = await authApi.me();

  if (user) return user;

  try {
    const refreshedUser = await authApi.refresh();
    return refreshedUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      authApi.login(input),
    onSuccess: (user) => queryClient.setQueryData(AUTH_QUERY_KEY, user),
  });

  const registerMutation = useMutation({
    mutationFn: (input: Parameters<AuthContextValue["register"]>[0]) =>
      authApi.register(input),
    onSuccess: (user) => queryClient.setQueryData(AUTH_QUERY_KEY, user),
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.clear();
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (input: ChangePasswordInput) => authApi.changePassword(input),
    onSuccess: (user) => queryClient.setQueryData(AUTH_QUERY_KEY, user),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (input: UpdateProfileInput) => authApi.updateProfile(input),
    onSuccess: (user) => queryClient.setQueryData(AUTH_QUERY_KEY, user),
  });

  const refreshMutation = useMutation({
    mutationFn: () => authApi.refresh(),
    onSuccess: (user) => queryClient.setQueryData(AUTH_QUERY_KEY, user),
  });

  const user = (meQuery.data ?? null) as CurrentUser;

  const value: AuthContextValue = {
    user,
    isLoading: meQuery.isLoading,
    isAuthenticated: user !== null,
    login: (input) => loginMutation.mutateAsync(input),
    register: (input) => registerMutation.mutateAsync(input),
    logout: () => logoutMutation.mutateAsync().then(() => undefined),
    changePassword: (input) => changePasswordMutation.mutateAsync(input),
    updateProfile: (input) => updateProfileMutation.mutateAsync(input),
    refreshSession: () => refreshMutation.mutateAsync(),
    checkPermission: (...permissions) => {
      if (!user) return false;
      return hasPermission(user.role as UserRole, ...permissions);
    },
    loginError:
      loginMutation.error instanceof Error ? loginMutation.error.message : null,
    registerError:
      registerMutation.error instanceof Error
        ? registerMutation.error.message
        : null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
