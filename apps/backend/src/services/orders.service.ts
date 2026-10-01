import { connectDB } from "../config/db";
import { Order } from "../models/Order.model";
import { Product } from "../models/Product.model";
import { nextOrderNumber } from "../models/Counter.model";
import { emitOrderUpdated } from "../realtime/socket";
import { toPublicOrder } from "../utils/orderMapper.util";
import type { PublicUser, PublicOrder, DeliveryAddress } from "@tea-and-snacks/shared";
import { BUILDINGS, discountedPrice } from "@tea-and-snacks/shared";
import { sendToVendor, sendToAdmins, sendToUser } from "./notification.service";
import { MESSAGES, DYNAMIC_MESSAGES } from "../constants/messages";

const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5MB

export type PlaceOrderInput = {
  customerName: string;
  customerPhone: string;
  paymentMethod: "online" | "offline";
  deliveryAddress: DeliveryAddress;
  items: { productId: string; variantId?: string; qty: number }[];
};

export async function placeOrder(
  data: PlaceOrderInput,
  user: PublicUser,
): Promise<PublicOrder> {
  await connectDB();

  // Prices/names/vendorIds always come from the DB, never the client, so a
  // tampered request body can't change what an order actually charges.
  const products = await Product.find({
    _id: { $in: data.items.map((i) => i.productId) },
  }).lean();
  const byId = new Map(products.map((p) => [p._id as unknown as string, p]));

  const items = data.items.map(({ productId, variantId, qty }) => {
    const product = byId.get(productId) as any;
    if (!product)
      throw new Error(DYNAMIC_MESSAGES.PRODUCT_NO_LONGER_AVAILABLE(productId));

    const isOrderable = product.status === "available" || (!product.status && product.isAvailable !== false);
    if (!isOrderable) {
      throw new Error(DYNAMIC_MESSAGES.PRODUCT_UNAVAILABLE_FOR_ORDER(product.name));
    }

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
      price: discountedPrice(price, product.discountPercent),
    };
  });

  const uniqueVendorIdsForValidation = new Set(items.map((i) => i.vendorId).filter(Boolean));
  if (uniqueVendorIdsForValidation.size > 1) {
    throw new Error(MESSAGES.SINGLE_VENDOR_ORDER_ONLY);
  }

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  // ── Validate delivery address ─────────────────────────────────────
  const addr = data.deliveryAddress;
  if (!addr) throw new Error(MESSAGES.MISSING_DELIVERY_ADDRESS);
  if (!BUILDINGS.some((b) => b.id === addr.building)) {
    throw new Error(MESSAGES.INVALID_BUILDING);
  }
  if (!addr.floor?.trim()) throw new Error(MESSAGES.MISSING_FLOOR);
  if (!addr.officeNumber?.trim()) throw new Error(MESSAGES.MISSING_OFFICE_NUMBER);
  if (!addr.recipientPhone?.trim()) throw new Error(MESSAGES.MISSING_RECIPIENT_PHONE);

  const orderNumber = await nextOrderNumber();
  const order = await Order.create({
    displayId: String(orderNumber),
    token: `A${orderNumber}`,
    userId: user.id,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    paymentMethod: data.paymentMethod,
    deliveryAddress: {
      building: addr.building,
      floor: addr.floor.trim(),
      officeNumber: addr.officeNumber.trim(),
      recipientName: addr.recipientName?.trim() || data.customerName,
      recipientPhone: addr.recipientPhone.trim(),
    },
    items,
    total,
  });

  // Notify vendors involved in this order
  const uniqueVendorIds = [...new Set(items.map(i => i.vendorId).filter(Boolean))] as string[];
  for (const vId of uniqueVendorIds) {
    await sendToVendor(vId, {
      title: "New Order Received!",
      body: `Order #${order.displayId} from ${data.customerName} for ₹${total}`,
      data: { type: "new_order", orderId: String(order.displayId) },
    });
  }

  // Notify admins
  await sendToAdmins({
    title: "New Order Placed",
    body: `Order #${order.displayId} for ₹${total} (Vendor: ${uniqueVendorIds.join(", ")})`,
    data: { type: "new_order", orderId: String(order.displayId) },
  });

  return toPublicOrder(order);
}

export async function getOrders(user: PublicUser): Promise<PublicOrder[]> {
  await connectDB();
  const orders = await Order.find({ userId: user.id }).sort({ placedAt: -1 });
  return orders.map(toPublicOrder);
}

export async function getOrder(
  orderId: string,
  user: PublicUser,
): Promise<PublicOrder | null> {
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
    throw new Error(MESSAGES.UNAUTHORIZED_ORDER_ACCESS);
  }
  return toPublicOrder(order);
}

export type UploadProofInput = {
  fileName: string;
  dataUrl: string;
};

export async function uploadPaymentProof(
  orderId: string,
  data: UploadProofInput,
  user: PublicUser,
): Promise<PublicOrder> {
  if (data.dataUrl.length > MAX_PROOF_BYTES * 1.4) {
    throw new Error(MESSAGES.SCREENSHOT_TOO_LARGE);
  }
  await connectDB();
  const order = await Order.findOne({ displayId: orderId });
  if (!order) throw new Error(MESSAGES.ORDER_NOT_FOUND);
  if (String(order.userId) !== user.id)
    throw new Error(MESSAGES.UNAUTHORIZED_ORDER_ACCESS);

  order.paymentProofName = data.fileName;
  order.paymentProofUrl = data.dataUrl;
  order.paymentRejected = false;
  // Note: We no longer auto-confirm on upload. Vendor must manually confirm.
  await order.save();

  const demoOrder = toPublicOrder(order);
  emitOrderUpdated({ id: demoOrder.id, items: demoOrder.items });
  return demoOrder;
}

function checkOrderAccess(order: any, user: PublicUser) {
  if (user.role === "admin") return;
  if (user.role === "customer") {
    if (String(order.userId) !== user.id) {
      throw new Error(MESSAGES.UNAUTHORIZED_ORDER_ACCESS);
    }
  } else if (user.role === "vendor") {
    if (!order.items.some((i: any) => i.vendorId === user.vendorId)) {
      throw new Error(MESSAGES.UNAUTHORIZED_ORDER_ACCESS);
    }
  }
}

export async function addChatMessage(orderId: string, text: string, user: PublicUser): Promise<PublicOrder> {
  await connectDB();
  const order = await Order.findOne({ displayId: orderId });
  if (!order) throw new Error(MESSAGES.ORDER_NOT_FOUND);

  checkOrderAccess(order, user);

  order.messages.push({
    senderRole: user.role,
    senderName: user.name,
    text,
    timestamp: new Date()
  });

  await order.save();

  const demoOrder = toPublicOrder(order);
  emitOrderUpdated({ id: demoOrder.id, items: demoOrder.items });
  return demoOrder;
}

export async function cancelOrder(orderId: string, reason: string | undefined, user: PublicUser): Promise<PublicOrder> {
  await connectDB();
  const order = await Order.findOne({ displayId: orderId });
  if (!order) throw new Error(MESSAGES.ORDER_NOT_FOUND);

  checkOrderAccess(order, user);

  if (order.status === "Cancelled" || order.status === "Delivered" || order.status === "Rejected") {
    throw new Error(DYNAMIC_MESSAGES.ORDER_IS_ALREADY(order.status));
  }

  if (user.role === "customer" && order.status !== "New") {
    throw new Error(MESSAGES.CANT_CANCEL_IN_PROGRESS_ORDER);
  }

  order.status = "Cancelled";
  order.statusUpdatedAt = new Date();
  order.cancelledBy = user.role;
  if (reason) {
    order.cancellationReason = reason;
  }

  await order.save();

  // Notify parties
  if (user.role === "customer") {
    // Notify vendor
    const uniqueVendorIds = [...new Set(order.items.map((i: any) => i.vendorId).filter(Boolean))] as string[];
    for (const vId of uniqueVendorIds) {
      await sendToVendor(vId, {
        title: "Order Cancelled",
        body: `Order #${order.displayId} was cancelled by the customer.`,
        data: { type: "order_cancelled", orderId: String(order.displayId) },
      });
    }
  } else {
    // Notify user
    await sendToUser(String(order.userId), {
      title: "Order Cancelled",
      body: `Your order #${order.displayId} was cancelled by the ${user.role}.`,
      data: { type: "order_cancelled", orderId: String(order.displayId) },
    });
  }

  const demoOrder = toPublicOrder(order);
  emitOrderUpdated({ id: demoOrder.id, items: demoOrder.items });
  return demoOrder;
}
