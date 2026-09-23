import type { Product, Vendor } from "@/lib/data";

/** Extra keywords so "tea", "snacks", "sweet" etc. match the right items. */
const keywords: Record<string, string> = {
  "tea-point": "tea chai coffee drinks hot beverage snacks breakfast",
  "snack-shack": "snacks fast food burger fries junk",
  "green-bowl": "healthy salad wrap diet light lunch veg",
  "tandoor-house": "lunch dinner meal north indian curry biryani rice",
  "roll-express": "rolls momos noodles chinese street food snacks",
  "sweet-corner": "dessert sweet cake shake cold ice",
};

const norm = (s: string) => s.toLowerCase().trim();

export type SearchResult =
  | { kind: "vendor"; vendor: Vendor }
  | { kind: "product"; product: Product; vendor: Vendor };

export const quickSearches = [
  "Tea",
  "Snacks",
  "Burger",
  "Biryani",
  "Momos",
  "Dessert",
  "Veg",
];

export function searchAll(
  query: string,
  vendors: Vendor[],
  products: Product[],
): SearchResult[] {
  const q = norm(query);
  if (!q) return [];

  const vendorHits = vendors
    .filter((v) =>
      `${v.name} ${v.cuisine} ${keywords[v.id] ?? ""}`
        .toLowerCase()
        .includes(q),
    )
    .map((vendor) => ({ kind: "vendor" as const, vendor }));

  const productHits = products
    .filter((p) => {
      const v = vendors.find((x) => x.id === p.vendorId);
      if (!v) return false;
      // "veg"/"non-veg" must not share the substring "veg", or searching
      // "veg" would also match non-veg dishes (see doc/MONGODB_BACKEND.md).
      const hay =
        `${p.name} ${p.tag ?? ""} ${v.name} ${v.cuisine} ${keywords[v.id] ?? ""} ${
          p.veg ? "veg vegetarian" : "meat chicken egg"
        }`.toLowerCase();
      return hay.includes(q);
    })
    .map((product) => ({
      kind: "product" as const,
      product,
      vendor: vendors.find((x) => x.id === product.vendorId)!,
    }));

  return [...productHits, ...vendorHits];
}

/** Short list of suggestion strings for the type-ahead dropdown. */
export function suggest(
  query: string,
  vendors: Vendor[],
  products: Product[],
  limit = 6,
): SearchResult[] {
  return searchAll(query, vendors, products).slice(0, limit);
}
