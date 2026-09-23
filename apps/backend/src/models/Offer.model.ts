import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const offerSchema = new Schema(
  {
    _id: { type: String, required: true }, // e.g. "o1"
    title: { type: String, required: true },
    detail: { type: String, required: true },
    code: { type: String, required: true },
    accent: {
      type: String,
      enum: ["mango", "chili", "mint", "berry", "sky", "grape"],
      required: true,
    },
    vendorId: { type: String, ref: "Vendor" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

export const Offer = models.Offer ?? model("Offer", offerSchema);
