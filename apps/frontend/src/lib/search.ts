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


