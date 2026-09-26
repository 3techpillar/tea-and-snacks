import { connectDB } from "../config/db";
import { Order } from "../models/Order.model";
import { Product } from "../models/Product.model";
import { nextOrderNumber } from "../models/Counter.model";
import { emitOrderUpdated } from "../realtime/socket";
import { toDemoOrder } from "../utils/orderMapper.util";
import type { PublicUser, DemoOrder } from "@tea-and-snacks/shared";

const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5MB

export type PlaceOrderInput = {
  customerName: string;
  customerPhone: string;
  items: { productId: string; variantId?: string; qty: number }[];
};

export async function placeOrder(
  data: PlaceOrderInput,
  user: PublicUser,
): Promise<DemoOrder> {
  await connectDB();

  // Prices/names/vendorIds always come from the DB, never the client, so a
  // tampered request body can't change what an order actually charges.
  const products = await Product.find({
    _id: { $in: data.items.map((i) => i.productId) },
  }).lean();
  const byId = new Map(products.map((p) => [p._id as unknown as string, p]));

  const items = data.items.map(({ productId, variantId, qty }) => {
    const product = byId.get(productId);
    if (!product)
      throw new Error(`Product ${productId} is no longer available.`);

    let price = product.price;
    let variantName: string | undefined = undefined;

    if (variantId && product.variants && product.variants.length > 0) {
      const variant = (product.variants as { id: string; name: string; price: number }[]).find(v => v.id === variantId);
      if (variant) {
        price = variant.price;
        variantName = variant.name;
      }
    }

    return {
      productId,
      vendorId: product.vendorId,
      name: product.name,
      variantId,
      variantName,
      emoji: product.emoji,
      qty,
      price,
    };
  });
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const orderNumber = await nextOrderNumber();
  const order = await Order.create({
    displayId: String(orderNumber),
    token: `A${orderNumber}`,
    userId: user.id,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    items,
    total,
  });

  return toDemoOrder(order);
}

export async function getOrders(user: PublicUser): Promise<DemoOrder[]> {
  await connectDB();
  const orders = await Order.find({ userId: user.id }).sort({ placedAt: -1 });
  return orders.map(toDemoOrder);
}

export async function getOrder(
  orderId: string,
  user: PublicUser,
): Promise<DemoOrder | null> {
  await connectDB();
  const order = await Order.findOne({ displayId: orderId });
  if (!order) return null;

  const isOwner = String(order.userId) === user.id;
  const isVendorOnOrder =
    user.role === "vendor" &&
    order.items.some(
      (i: { vendorId?: string }) => i.vendorId === user.vendorId,
    );
  if (!isOwner && !isVendorOnOrder && user.role !== "admin") {
    throw new Error("You don't have access to this order.");
  }
  return toDemoOrder(order);
}

export type UploadProofInput = {
  fileName: string;
  dataUrl: string;
};

export async function uploadPaymentProof(
  orderId: string,
  data: UploadProofInput,
  user: PublicUser,
): Promise<DemoOrder> {
  if (data.dataUrl.length > MAX_PROOF_BYTES * 1.4) {
    throw new Error("Screenshot is too large (max 5MB).");
  }
  await connectDB();
  const order = await Order.findOne({ displayId: orderId });
  if (!order) throw new Error("Order not found.");
  if (String(order.userId) !== user.id)
    throw new Error("You don't have access to this order.");

  order.paymentProofName = data.fileName;
  order.paymentProofUrl = data.dataUrl;
  order.paymentRejected = false;
  await order.save();

  const demoOrder = toDemoOrder(order);
  emitOrderUpdated({ id: demoOrder.id, items: demoOrder.items });
  return demoOrder;
}

function checkOrderAccess(order: any, user: PublicUser) {
  if (user.role === "admin") return;
  if (user.role === "customer") {
    if (String(order.userId) !== user.id) {
      throw new Error("You don't have access to this order.");
    }
  } else if (user.role === "vendor") {
    if (!order.items.some((i: any) => i.vendorId === user.vendorId)) {
      throw new Error("You don't have access to this order.");
    }
  }
}

export async function addChatMessage(orderId: string, text: string, user: PublicUser): Promise<DemoOrder> {
  await connectDB();
  const order = await Order.findOne({ displayId: orderId });
  if (!order) throw new Error("Order not found.");
  
  checkOrderAccess(order, user);

  order.messages.push({
    senderRole: user.role,
    senderName: user.name,
    text,
    timestamp: new Date()
  });

  await order.save();

  const demoOrder = toDemoOrder(order);
  emitOrderUpdated({ id: demoOrder.id, items: demoOrder.items });
  return demoOrder;
}

export async function cancelOrder(orderId: string, reason: string | undefined, user: PublicUser): Promise<DemoOrder> {
  await connectDB();
  const order = await Order.findOne({ displayId: orderId });
  if (!order) throw new Error("Order not found.");
  
  checkOrderAccess(order, user);

  if (order.status === "Cancelled" || order.status === "Completed") {
    throw new Error(`Order is already ${order.status}`);
  }

  if (user.role === "customer" && order.status !== "Pending") {
    throw new Error("Customers can only cancel orders when they are Pending.");
  }

  order.status = "Cancelled";
  order.statusUpdatedAt = new Date();
  order.cancelledBy = user.role;
  if (reason) {
    order.cancellationReason = reason;
  }

  await order.save();

  const demoOrder = toDemoOrder(order);
  emitOrderUpdated({ id: demoOrder.id, items: demoOrder.items });
  return demoOrder;
}
