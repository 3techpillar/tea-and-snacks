import { connectDB } from "../config/db";
import { Order, type OrderDoc, type OrderStatus } from "../models/Order.model";
import { emitOrderUpdated } from "../realtime/socket";
import { toDemoOrder } from "../utils/orderMapper.util";
import { vendorSlice, ALLOWED_TRANSITIONS } from "@tea-and-snacks/shared";
import type { DemoOrder } from "@tea-and-snacks/shared";
import { sendToUser } from "./notification.service";
import { MESSAGES, DYNAMIC_MESSAGES } from "../constants/messages";

/** Loads the order and 403s unless it actually contains an item for this vendor. */
async function loadOrderForVendor(orderId: string, vendorId: string) {
  await connectDB();
  const order = await Order.findOne({ displayId: orderId });
  if (!order) throw new Error(MESSAGES.ORDER_NOT_FOUND);
  if (
    !order.items.some((i: { vendorId?: string }) => i.vendorId === vendorId)
  ) {
    throw new Error(MESSAGES.ORDER_NOT_FOR_YOUR_STALL);
  }
  return order;
}

function broadcast(order: OrderDoc): DemoOrder {
  const demo = toDemoOrder(order);
  emitOrderUpdated({ id: demo.id, items: demo.items });
  return demo;
}

export async function getVendorOrders(
  vendorId: string,
  status?: string,
  page: number = 1,
  limit: number = 50
): Promise<{ data: DemoOrder[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
  await connectDB();
  
  const query: any = { "items.vendorId": vendorId };
  
  if (status && status !== "All") {
    if (status === "Live") {
      query.status = { $nin: ["Delivered", "Cancelled", "Rejected"] };
    } else {
      query.status = status;
    }
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(query).sort({ placedAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(query)
  ]);

  return {
    data: orders.map(toDemoOrder),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getVendorStats(vendorId: string) {
  await connectDB();
  const orders = await Order.find({ "items.vendorId": vendorId });
  const demoOrders = orders.map(toDemoOrder);
  const live = demoOrders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Cancelled" && o.status !== "Rejected",
  );
  const earned = demoOrders
    .filter((o) => o.paymentConfirmed && o.status !== "Cancelled")
    .reduce((s, o) => s + vendorSlice(o, vendorId).subtotal, 0);
  return {
    live: live.length,
    pending: demoOrders.filter((o) => o.status === "New").length,
    awaitingPay: demoOrders.filter(
      (o) => !o.paymentConfirmed && o.status !== "Cancelled",
    ).length,
    earned,
  };
}

export async function updateOrderStatus(
  vendorId: string,
  orderId: string,
  status: OrderStatus,
): Promise<DemoOrder> {
  const order = await loadOrderForVendor(orderId, vendorId);

  const from = order.status as OrderStatus;
  if (
    from !== status &&
    !ALLOWED_TRANSITIONS[from].includes(status)
  ) {
    throw new Error(DYNAMIC_MESSAGES.CANT_MOVE_ORDER(from, status));
  }
  if (status === "Delivered" && !order.paymentConfirmed) {
    throw new Error(MESSAGES.PAYMENT_NOT_CONFIRMED);
  }

  order.status = status;
  await order.save();

  // Notify the customer
  await sendToUser(String(order.userId), {
    title: `Order ${status}`,
    body: `Your order #${order.displayId} is now ${status}.`,
    data: { type: "order_status", orderId: String(order.displayId) },
  });

  return broadcast(order);
}

export async function confirmPayment(
  vendorId: string,
  orderId: string,
): Promise<DemoOrder> {
  const order = await loadOrderForVendor(orderId, vendorId);
  order.paymentConfirmed = true;
  order.paymentRejected = false;
  await order.save();
  return broadcast(order);
}

export async function rejectPayment(
  vendorId: string,
  orderId: string,
): Promise<DemoOrder> {
  const order = await loadOrderForVendor(orderId, vendorId);
  order.paymentConfirmed = false;
  order.paymentRejected = true;
  await order.save();
  return broadcast(order);
}

export async function addVendorNote(
  vendorId: string,
  orderId: string,
  note: string,
): Promise<DemoOrder> {
  const order = await loadOrderForVendor(orderId, vendorId);
  order.vendorNote = note;
  await order.save();
  return broadcast(order);
}
