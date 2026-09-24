import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

// _id is the human-readable slug (e.g. "tea-point") rather than an ObjectId,
// so it matches the ids the frontend already uses in URLs and cart/order
// records, and the seed script can upsert idempotently by slug.
const vendorSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    cuisine: { type: String, required: true },
    emoji: { type: String, required: true },
    rating: { type: Number, required: true },
    eta: { type: String, required: true },
    accent: {
      type: String,
      enum: ["mango", "chili", "mint", "berry", "sky", "grape"],
      required: true,
    },
    tagline: { type: String, required: true },
    counter: { type: String, required: true },
    hours: { type: String, required: true },
    specialty: { type: String, required: true },
    upiId: { type: String, required: true },
    highlights: { type: [String], default: [] },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    isAcceptingOrders: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

export const Vendor = models.Vendor ?? model("Vendor", vendorSchema);
