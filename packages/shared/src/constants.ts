import type { OrderStatus, DemoOrder } from "./types";

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

/** An order with no progress for this long is flagged as delayed for admin. */
export const DELAY_THRESHOLD_MINUTES = 10;

/**
 * Explicit state machine so a vendor can't jump an order backwards or skip
 * straight to Completed without ever confirming payment.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Pending: ["Accepted", "Cancelled"],
  Accepted: ["Preparing", "Cancelled"],
  Preparing: ["Ready", "Cancelled"],
  Ready: ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

/** Items of an order belonging to one vendor, plus that vendor's subtotal. */
export function vendorSlice(order: DemoOrder, vendorId: string) {
  const items = order.items.filter((i) => i.vendorId === vendorId);
  return { items, subtotal: items.reduce((s, i) => s + i.price * i.qty, 0) };
}
