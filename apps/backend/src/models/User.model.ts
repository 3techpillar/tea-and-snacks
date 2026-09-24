import mongoose, { type HydratedDocument } from "mongoose";
const { Schema, model, models } = mongoose;

import type { UserRole } from "@tea-and-snacks/shared";
export type { UserRole };

export type UserDoc = HydratedDocument<{
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  vendorId?: string;
  tokenVersion: number;
  isActive: boolean;
  lastLoginAt?: Date;
  refreshTokenHash?: string;
}>;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "vendor", "admin"],
      default: "customer",
      required: true,
    },
    vendorId: { type: String, ref: "Vendor" },
    tokenVersion: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    refreshTokenHash: { type: String },
  },
  { timestamps: true },
);

export const User = models.User ?? model("User", userSchema);

export function toPublicUser(user: UserDoc) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    role: user.role,
    vendorId: user.vendorId ?? undefined,
    isActive: user.isActive,
  };
}

export type PublicUser = ReturnType<typeof toPublicUser>;
