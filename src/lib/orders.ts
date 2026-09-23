// Shared types/constants for orders. Persistence now lives in MongoDB via
// the server functions in src/lib/api/orders.ts and src/lib/api/vendor.ts
// — this module only holds the wire-format types and pure display helpers
// that both server and client code need.

export type OrderStatus =
  | "Pending"
  | "Accepted"
  | "Preparing"
  | "Ready"
  | "Completed"
  | "Cancelled";

export type OrderItem = {
  productId?: string;
  vendorId?: string;
  name: string;
  emoji: string;
  qty: number;
  price: number;
};

export type DemoOrder = {
  id: string;
  token: string;
  customer: string;
  phone: string;
  status: OrderStatus;
  placedAt: string;
  paymentConfirmed: boolean;
  paymentRejected?: boolean;
  vendorNote?: string;
  paymentProofName?: string;
  paymentProofUrl?: string;
  items: OrderItem[];
  total: number;
  /** Set when admin cancelled this order at an unresponsive vendor. */
  needsRebooking?: boolean;
  /** Shown to the customer when admin intervenes (e.g. explains a cancellation). */
  adminNote?: string;
};

/** Richer view used only by the admin dashboard (src/routes/admin.tsx). */
export type AdminOrderView = DemoOrder & {
  statusUpdatedAt: string;
  lastVendorNotifiedAt?: string;
  isDelayed: boolean;
  minutesInStatus: number;
};

/** An order with no progress for this long is flagged as delayed for admin. */
export const DELAY_THRESHOLD_MINUTES = 10;

/** Progress track shown to the customer. */
export const orderStatuses: OrderStatus[] = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready",
];

/** Statuses a vendor can move an order through. */
export const vendorStatuses: OrderStatus[] = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready",
  "Completed",
  "Cancelled",
];

export const statusToneClass: Record<OrderStatus, string> = {
  Pending: "bg-mango-soft text-mango-ink",
  Accepted: "bg-sky-soft text-sky-ink",
  Preparing: "bg-berry-soft text-berry-ink",
  Ready: "bg-mint-soft text-mint-ink",
  Completed: "bg-secondary text-foreground",
  Cancelled: "bg-chili-soft text-chili-ink",
};

/** Items of an order belonging to one vendor, plus that vendor's subtotal. */
export function vendorSlice(order: DemoOrder, vendorId: string) {
  const items = order.items.filter((i) => i.vendorId === vendorId);
  return { items, subtotal: items.reduce((s, i) => s + i.price * i.qty, 0) };
}
