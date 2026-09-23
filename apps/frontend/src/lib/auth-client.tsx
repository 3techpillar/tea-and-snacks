import { createContext, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import type { PublicUser } from "@tea-and-snacks/shared";

export type CurrentUser = PublicUser | null;

const AUTH_QUERY_KEY = ["auth", "me"] as const;

type AuthContextValue = {
  user: CurrentUser;
  isLoading: boolean;
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
  loginError: string | null;
  registerError: string | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => authApi.me(),
    staleTime: 60_000,
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
    onSuccess: () => queryClient.setQueryData(AUTH_QUERY_KEY, null),
  });

  const value: AuthContextValue = {
    user: (meQuery.data ?? null) as CurrentUser,
    isLoading: meQuery.isLoading,
    login: (input) => loginMutation.mutateAsync(input),
    register: (input) => registerMutation.mutateAsync(input),
    logout: () => logoutMutation.mutateAsync().then(() => undefined),
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
