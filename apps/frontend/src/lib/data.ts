import type { Product, Vendor, Offer, AccentColor } from "@tea-and-snacks/shared";
export type { Product, Vendor, Offer, AccentColor };

// The actual catalog now lives in MongoDB and is fetched via the REST API.
// These helpers are pure display utilities used only by the frontend.

export const productsByVendor = (products: Product[], vendorId: string) =>
  products.filter((p) => p.vendorId === vendorId);

export const vendorById = (vendors: Vendor[], id: string) =>
  vendors.find((v) => v.id === id);

export const accentClass: Record<Vendor["accent"], string> = {
  mango: "bg-mango text-mango-foreground",
  chili: "bg-chili text-chili-foreground",
  mint: "bg-mint text-mint-foreground",
  berry: "bg-berry text-berry-foreground",
  sky: "bg-sky text-sky-foreground",
  grape: "bg-grape text-grape-foreground",
};

export const accentSoftClass: Record<Vendor["accent"], string> = {
  mango: "bg-mango-soft text-mango-ink",
  chili: "bg-chili-soft text-chili-ink",
  mint: "bg-mint-soft text-mint-ink",
  berry: "bg-berry-soft text-berry-ink",
  sky: "bg-sky-soft text-sky-ink",
  grape: "bg-grape-soft text-grape-ink",
};
