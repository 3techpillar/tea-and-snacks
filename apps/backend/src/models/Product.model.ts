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
    isAvailable: { type: Boolean, default: true }, // Deprecated
    status: {
      type: String,
      enum: ["available", "unavailable", "out_of_stock", "coming_soon"],
      default: "available",
    },
    prepTime: { type: Number, default: null }, // e.g. 10, 20, 30. null means standard.
    isQuickDelivery: { type: Boolean, default: false },
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
