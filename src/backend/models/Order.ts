import mongoose, { type HydratedDocument, type Types } from "mongoose";
const { Schema, model, models } = mongoose;

export type OrderStatus =
  | "Pending"
  | "Accepted"
  | "Preparing"
  | "Ready"
  | "Completed"
  | "Cancelled";

export type OrderItemDoc = {
  productId?: string;
  vendorId?: string;
  name: string;
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
    // stuck in one state too long (see src/lib/api/admin.ts).
    statusUpdatedAt: { type: Date, default: Date.now },
    // Set when admin cancels an order at an unresponsive vendor so a human
    // can follow up with the customer outside the app (see ADR in
    // doc/MONGODB_BACKEND.md — reassigning to a different stall isn't
    // meaningful since stalls sell disjoint menus).
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

/**
 * Explicit state machine so a vendor can't jump an order backwards or skip
 * straight to Completed without ever confirming payment — the old
 * localStorage demo let any status button fire from any state.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Pending: ["Accepted", "Cancelled"],
  Accepted: ["Preparing", "Cancelled"],
  Preparing: ["Ready", "Cancelled"],
  Ready: ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};
