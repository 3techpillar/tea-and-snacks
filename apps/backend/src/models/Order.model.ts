import mongoose, { type HydratedDocument, type Types } from "mongoose";
const { Schema, model, models } = mongoose;

import type { OrderStatus as SharedOrderStatus } from "@tea-and-snacks/shared";

export type OrderStatus = SharedOrderStatus;

export type OrderItemDoc = {
  productId?: string;
  vendorId?: string;
  name: string;
  variantId?: string;
  variantName?: string;
  emoji: string;
  qty: number;
  price: number;
};

export type OrderDoc = HydratedDocument<{
  displayId: string;
  token: string;
  userId: Types.ObjectId;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  items: OrderItemDoc[];
  total: number;
  paymentConfirmed: boolean;
  paymentRejected: boolean;
  paymentProofName?: string;
  paymentProofUrl?: string;
  vendorNote?: string;
  placedAt: Date;
  statusUpdatedAt: Date;
  needsRebooking: boolean;
  adminNote?: string;
  lastVendorNotifiedAt?: Date;
}>;

const orderItemSchema = new Schema<OrderItemDoc>(
  {
    productId: String,
    vendorId: String,
    name: { type: String, required: true },
    variantId: String,
    variantName: String,
    emoji: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    displayId: { type: String, required: true, unique: true },
    token: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Preparing",
        "Ready",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: (v: unknown[]) => v.length > 0,
    },
    total: { type: Number, required: true, min: 0 },
    paymentConfirmed: { type: Boolean, default: false },
    paymentRejected: { type: Boolean, default: false },
    paymentProofName: String,
    paymentProofUrl: String,
    vendorNote: String,
    placedAt: { type: Date, default: Date.now },
    // Bumped every time `status` changes; admin uses this to detect an order
    // stuck in one state too long.
    statusUpdatedAt: { type: Date, default: Date.now },
    // Set when admin cancels an order at an unresponsive vendor.
    needsRebooking: { type: Boolean, default: false },
    adminNote: String,
    lastVendorNotifiedAt: Date,
  },
  { timestamps: true },
);

orderSchema.index({ "items.vendorId": 1 });
orderSchema.index({ userId: 1, placedAt: -1 });
orderSchema.index({ status: 1, statusUpdatedAt: 1 });
orderSchema.index({ placedAt: -1 });

export const Order = models.Order ?? model("Order", orderSchema);
