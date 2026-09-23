import type { OrderDoc } from "./models/Order";
import type { DemoOrder } from "@/lib/orders";

/**
 * Maps a Mongoose order document to the wire-format DemoOrder shape used by
 * both server functions and the frontend. Mongoose subdocuments (o.items)
 * aren't plain objects — they carry methods/getters that the server-fn RPC
 * serializer (seroval) can't handle — so this copies out just the plain
 * fields rather than passing them through directly.
 */
export function toDemoOrder(o: OrderDoc): DemoOrder {
  return {
    id: o.displayId,
    token: o.token,
    customer: o.customerName,
    phone: o.customerPhone,
    status: o.status,
    placedAt: o.placedAt.toISOString(),
    paymentConfirmed: o.paymentConfirmed,
    paymentRejected: o.paymentRejected,
    vendorNote: o.vendorNote ?? undefined,
    paymentProofName: o.paymentProofName ?? undefined,
    paymentProofUrl: o.paymentProofUrl ?? undefined,
    items: o.items.map((i) => ({
      productId: i.productId ?? undefined,
      vendorId: i.vendorId ?? undefined,
      name: i.name,
      emoji: i.emoji,
      qty: i.qty,
      price: i.price,
    })),
    total: o.total,
  };
}
