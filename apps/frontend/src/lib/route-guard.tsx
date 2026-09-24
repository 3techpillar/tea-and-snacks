import { redirect } from "@tanstack/react-router";
import type { UserRole, Permission } from "@tea-and-snacks/shared";
import { hasPermission } from "@tea-and-snacks/shared";

type BeforeLoadContext = {
  location: { pathname: string; search: Record<string, unknown> };
};

export function requireAuth({ location }: BeforeLoadContext) {
}

export function requireRole(role: UserRole) {
  return (_ctx: BeforeLoadContext) => {
  };
}

export function requirePermissions(...permissions: Permission[]) {
  return (_ctx: BeforeLoadContext) => {
  };
}

export { redirect };
