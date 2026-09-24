import type { UserRole } from "./types";

export const Permission = {
  /** Place new orders as a customer */
  PLACE_ORDER: "PLACE_ORDER",
  /** View orders the current user has placed */
  VIEW_OWN_ORDERS: "VIEW_OWN_ORDERS",
  /** Manage the stall this vendor account is linked to */
  MANAGE_STALL: "MANAGE_STALL",
  /** View and manage ALL orders across vendors (admin) */
  MANAGE_ALL_ORDERS: "MANAGE_ALL_ORDERS",
  /** Manage user accounts (admin) */
  MANAGE_USERS: "MANAGE_USERS",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  customer: [Permission.PLACE_ORDER, Permission.VIEW_OWN_ORDERS],
  vendor: [
    Permission.PLACE_ORDER,
    Permission.VIEW_OWN_ORDERS,
    Permission.MANAGE_STALL,
  ],
  admin: [
    Permission.PLACE_ORDER,
    Permission.VIEW_OWN_ORDERS,
    Permission.MANAGE_STALL,
    Permission.MANAGE_ALL_ORDERS,
    Permission.MANAGE_USERS,
  ],
} as const;

export function hasPermission(
  role: UserRole,
  ...required: Permission[]
): boolean {
  const granted = ROLE_PERMISSIONS[role] ?? [];
  return required.every((p) => granted.includes(p));
}
