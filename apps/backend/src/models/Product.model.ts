import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const productSchema = new Schema(
  {
    _id: { type: String, required: true }, // e.g. "p1"
    vendorId: { type: String, ref: "Vendor", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    emoji: { type: String, required: true },
    veg: { type: Boolean, required: true },
    tag: { type: String },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    hasVariants: { type: Boolean, default: false },
    variantLabel: { type: String },
    variants: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
  },
  { timestamps: true, _id: false },
);

productSchema.index({ vendorId: 1 });

export const Product = models.Product ?? model("Product", productSchema);
