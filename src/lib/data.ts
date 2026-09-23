export type Product = {
  id: string;
  vendorId: string;
  name: string;
  price: number;
  emoji: string;
  veg: boolean;
  tag?: string;
};

export type Vendor = {
  id: string;
  name: string;
  cuisine: string;
  emoji: string;
  rating: number;
  eta: string;
  accent: "mango" | "chili" | "mint" | "berry" | "sky" | "grape";
  tagline: string;
  counter: string;
  hours: string;
  specialty: string;
  upiId: string;
  highlights: string[];
};

export type Offer = {
  id: string;
  title: string;
  detail: string;
  code: string;
  accent: Vendor["accent"];
};

// The actual catalog now lives in MongoDB (seeded from src/backend/seed-data.ts)
// and is fetched via the server functions in src/lib/api/catalog.ts. These
// helpers stay pure/parameterized so both server code and the `useCatalog()`
// client hook can reuse the same lookup logic against whatever list they hold.
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
