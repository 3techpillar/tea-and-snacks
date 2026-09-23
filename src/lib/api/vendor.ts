import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { connectDB } from "@/backend/db";
import {
  Order,
  ALLOWED_TRANSITIONS,
  type OrderDoc,
  type OrderStatus,
} from "@/backend/models/Order";
import { authMiddleware, requireVendorAccess } from "@/backend/auth/middleware";
import { emitOrderUpdated } from "@/backend/realtime";
import { toDemoOrder } from "@/backend/orderMapper";
import { vendorSlice } from "@/lib/orders";

/** Loads the order and 403s unless it actually contains an item for this vendor. */
async function loadOrderForVendor(orderId: string, vendorId: string) {
  await connectDB();
  const order = await Order.findOne({ displayId: orderId });
  if (!order) throw new Error("Order not found.");
  if (
    !order.items.some((i: { vendorId?: string }) => i.vendorId === vendorId)
  ) {
    throw new Error("This order doesn't include any of your items.");
  }
  return order;
}

function broadcast(order: OrderDoc) {
  const demo = toDemoOrder(order);
  emitOrderUpdated({ id: demo.id, items: demo.items });
  return demo;
}

const vendorIdSchema = z.object({ vendorId: z.string() });

export const getVendorOrdersFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(vendorIdSchema)
  .handler(async ({ data, context }) => {
    requireVendorAccess(context.user, data.vendorId);
    await connectDB();
    const orders = await Order.find({ "items.vendorId": data.vendorId }).sort({
      placedAt: -1,
    });
    return orders.map(toDemoOrder);
  });

export const getVendorStatsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(vendorIdSchema)
  .handler(async ({ data, context }) => {
    requireVendorAccess(context.user, data.vendorId);
    await connectDB();
    const orders = await Order.find({ "items.vendorId": data.vendorId });
    const demoOrders = orders.map(toDemoOrder);
    const live = demoOrders.filter(
      (o) => o.status !== "Completed" && o.status !== "Cancelled",
    );
    const earned = demoOrders
      .filter((o) => o.paymentConfirmed && o.status !== "Cancelled")
      .reduce((s, o) => s + vendorSlice(o, data.vendorId).subtotal, 0);
    return {
      live: live.length,
      pending: demoOrders.filter((o) => o.status === "Pending").length,
      awaitingPay: demoOrders.filter(
        (o) => !o.paymentConfirmed && o.status !== "Cancelled",
      ).length,
      earned,
    };
  });

const updateStatusSchema = z.object({
  vendorId: z.string(),
  orderId: z.string(),
  status: z.enum([
    "Pending",
    "Accepted",
    "Preparing",
    "Ready",
    "Completed",
    "Cancelled",
  ]),
});

export const updateOrderStatusFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(updateStatusSchema)
  .handler(async ({ data, context }) => {
    requireVendorAccess(context.user, data.vendorId);
    const order = await loadOrderForVendor(data.orderId, data.vendorId);

    const from = order.status as OrderStatus;
    if (
      from !== data.status &&
      !ALLOWED_TRANSITIONS[from].includes(data.status)
    ) {
      throw new Error(`Can't move an order from ${from} to ${data.status}.`);
    }
    if (data.status === "Completed" && !order.paymentConfirmed) {
      throw new Error("Confirm payment before marking the order Completed.");
    }

    order.status = data.status;
    await order.save();
    return broadcast(order);
  });

const paymentActionSchema = z.object({
  vendorId: z.string(),
  orderId: z.string(),
});

export const confirmPaymentFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(paymentActionSchema)
  .handler(async ({ data, context }) => {
    requireVendorAccess(context.user, data.vendorId);
    const order = await loadOrderForVendor(data.orderId, data.vendorId);
    order.paymentConfirmed = true;
    order.paymentRejected = false;
    await order.save();
    return broadcast(order);
  });

export const rejectPaymentFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(paymentActionSchema)
  .handler(async ({ data, context }) => {
    requireVendorAccess(context.user, data.vendorId);
    const order = await loadOrderForVendor(data.orderId, data.vendorId);
    order.paymentConfirmed = false;
    order.paymentRejected = true;
    await order.save();
    return broadcast(order);
  });

const addNoteSchema = z.object({
  vendorId: z.string(),
  orderId: z.string(),
  note: z.string().max(500),
});

export const addVendorNoteFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(addNoteSchema)
  .handler(async ({ data, context }) => {
    requireVendorAccess(context.user, data.vendorId);
    const order = await loadOrderForVendor(data.orderId, data.vendorId);
    order.vendorNote = data.note;
    await order.save();
    return broadcast(order);
  });
