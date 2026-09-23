import { connectDB } from "../config/db";
import { Order, type OrderDoc, type OrderStatus } from "../models/Order.model";
import { emitOrderUpdated } from "../realtime/socket";
import { toDemoOrder } from "../utils/orderMapper.util";
import { vendorSlice, ALLOWED_TRANSITIONS } from "@tea-and-snacks/shared";
import type { DemoOrder } from "@tea-and-snacks/shared";

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

function broadcast(order: OrderDoc): DemoOrder {
  const demo = toDemoOrder(order);
  emitOrderUpdated({ id: demo.id, items: demo.items });
  return demo;
}

export async function getVendorOrders(vendorId: string): Promise<DemoOrder[]> {
  await connectDB();
  const orders = await Order.find({ "items.vendorId": vendorId }).sort({
    placedAt: -1,
  });
  return orders.map(toDemoOrder);
}

export async function getVendorStats(vendorId: string) {
  await connectDB();
  const orders = await Order.find({ "items.vendorId": vendorId });
  const demoOrders = orders.map(toDemoOrder);
  const live = demoOrders.filter(
    (o) => o.status !== "Completed" && o.status !== "Cancelled",
  );
  const earned = demoOrders
    .filter((o) => o.paymentConfirmed && o.status !== "Cancelled")
    .reduce((s, o) => s + vendorSlice(o, vendorId).subtotal, 0);
  return {
    live: live.length,
    pending: demoOrders.filter((o) => o.status === "Pending").length,
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
    throw new Error(`Can't move an order from ${from} to ${status}.`);
  }
  if (status === "Completed" && !order.paymentConfirmed) {
    throw new Error("Confirm payment before marking the order Completed.");
  }

  order.status = status;
  await order.save();
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
