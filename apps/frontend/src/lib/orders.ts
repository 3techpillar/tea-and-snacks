// Shared types/constants for orders. Wire-format types come from the shared
// package. This module only holds frontend-specific display helpers.

export type {
  OrderStatus,
  OrderItem,
  DemoOrder,
  AdminOrderView,
} from "@tea-and-snacks/shared";

export {
  orderStatuses,
  vendorStatuses,
  DELAY_THRESHOLD_MINUTES,
  vendorSlice,
} from "@tea-and-snacks/shared";

import type { OrderStatus } from "@tea-and-snacks/shared";

export const statusToneClass: Record<OrderStatus, string> = {
  Pending: "bg-mango-soft text-mango-ink",
  Accepted: "bg-sky-soft text-sky-ink",
  Preparing: "bg-berry-soft text-berry-ink",
  Ready: "bg-mint-soft text-mint-ink",
  Completed: "bg-secondary text-foreground",
  Cancelled: "bg-chili-soft text-chili-ink",
};
