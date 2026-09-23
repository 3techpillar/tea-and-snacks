import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { connectDB } from "@/backend/db";
import { Order } from "@/backend/models/Order";
import { Product } from "@/backend/models/Product";
import { nextOrderNumber } from "@/backend/models/Counter";
import { authMiddleware, requireUser } from "@/backend/auth/middleware";
import { emitOrderUpdated } from "@/backend/realtime";
import { toDemoOrder } from "@/backend/orderMapper";

const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5MB, matches doc/MONGODB_BACKEND.md's storage guidance

const placeOrderSchema = z.object({
  customerName: z.string().trim().min(2),
  customerPhone: z.string().trim().min(8),
  items: z
    .array(
      z.object({ productId: z.string(), qty: z.number().int().min(1).max(50) }),
    )
    .min(1, "Your cart is empty."),
});

export const placeOrderFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(placeOrderSchema)
  .handler(async ({ data, context }) => {
    const user = requireUser(context.user);
    await connectDB();

    // Prices/names/vendorIds always come from the DB, never the client, so a
    // tampered request body can't change what an order actually charges.
    const products = await Product.find({
      _id: { $in: data.items.map((i) => i.productId) },
    }).lean();
    const byId = new Map(products.map((p) => [p._id as unknown as string, p]));

    const items = data.items.map(({ productId, qty }) => {
      const product = byId.get(productId);
      if (!product)
        throw new Error(`Product ${productId} is no longer available.`);
      return {
        productId,
        vendorId: product.vendorId,
        name: product.name,
        emoji: product.emoji,
        qty,
        price: product.price,
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
  });

export const getOrdersFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const user = requireUser(context.user);
    await connectDB();
    const orders = await Order.find({ userId: user.id }).sort({ placedAt: -1 });
    return orders.map(toDemoOrder);
  });

const getOrderSchema = z.object({ orderId: z.string() });

export const getOrderFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(getOrderSchema)
  .handler(async ({ data, context }) => {
    const user = requireUser(context.user);
    await connectDB();
    const order = await Order.findOne({ displayId: data.orderId });
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
  });

const uploadProofSchema = z.object({
  orderId: z.string(),
  fileName: z.string(),
  dataUrl: z
    .string()
    .refine(
      (v) => v.startsWith("data:image/"),
      "Only image uploads are allowed.",
    ),
});

export const uploadPaymentProofFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(uploadProofSchema)
  .handler(async ({ data, context }) => {
    const user = requireUser(context.user);
    if (data.dataUrl.length > MAX_PROOF_BYTES * 1.4) {
      // base64 is ~4/3 the size of the original bytes
      throw new Error("Screenshot is too large (max 5MB).");
    }
    await connectDB();
    const order = await Order.findOne({ displayId: data.orderId });
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
  });
