import { connectDB } from "../config/db";
import { Vendor } from "../models/Vendor.model";
import { Product } from "../models/Product.model";
import { Offer } from "../models/Offer.model";
import type { Catalog, Vendor as VendorDTO, Product as ProductDTO, Offer as OfferDTO } from "@tea-and-snacks/shared";

/** Single combined fetch so the whole app can prefetch/cache the catalog in one round trip. */
export async function getCatalog(): Promise<Catalog> {
  await connectDB();
  const [vendorDocs, productDocs, offerDocs] = await Promise.all([
    Vendor.find({ isActive: true }).sort({ name: 1 }).lean(),
    Product.find({ isActive: true }).lean(),
    Offer.find({ isActive: true }).lean(),
  ]);

  return {
    vendors: vendorDocs.map((v) => ({
      id: v._id as unknown as string,
      name: v.name,
      cuisine: v.cuisine,
      emoji: v.emoji,
      rating: v.rating,
      eta: v.eta,
      accent: v.accent as VendorDTO["accent"],
      tagline: v.tagline,
      counter: v.counter,
      hours: v.hours,
      specialty: v.specialty,
      upiId: v.upiId,
      highlights: v.highlights ?? [],
    })),
    products: productDocs.map((p) => ({
      id: p._id as unknown as string,
      vendorId: p.vendorId,
      name: p.name,
      price: p.price,
      emoji: p.emoji,
      veg: p.veg,
      tag: p.tag ?? undefined,
    })),
    offers: offerDocs.map((o) => ({
      id: o._id as unknown as string,
      title: o.title,
      detail: o.detail,
      code: o.code,
      accent: o.accent as OfferDTO["accent"],
    })),
  };
}
