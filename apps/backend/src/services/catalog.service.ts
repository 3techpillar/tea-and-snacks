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
      imageUrl: v.imageUrl,
    })),
    products: productDocs.map((p) => ({
      id: p._id as unknown as string,
      vendorId: p.vendorId,
      name: p.name,
      price: p.price,
      emoji: p.emoji,
      veg: p.veg,
      tag: p.tag ?? undefined,
      imageUrl: p.imageUrl,
      isAvailable: p.isAvailable,
      hasVariants: p.hasVariants,
      variantLabel: p.variantLabel,
      variants: p.variants as ProductDTO["variants"],
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

const norm = (s: string) => s.toLowerCase().trim();

export async function getCatalogSearch(query: string) {
  const catalog = await getCatalog();
  const q = norm(query);
  if (!q) return [];
  
  const terms = q.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const score = (name: string, haystack: string) => {
    let s = 0;
    const nameLower = norm(name);
    if (nameLower === q) s += 100;
    else if (nameLower.startsWith(q)) s += 50;
    else if (nameLower.includes(q)) s += 20;
    return s;
  };

  const vendorHits = catalog.vendors
    .map((vendor) => {
      const haystack = `${vendor.name} ${vendor.cuisine} ${vendor.specialty ?? ""} ${vendor.tagline ?? ""}`.toLowerCase();
      return { vendor, haystack };
    })
    .filter(({ haystack }) => terms.every(term => haystack.includes(term)))
    .map(({ vendor, haystack }) => ({ 
      kind: "vendor" as const, 
      vendor,
      _score: score(vendor.name, haystack)
    }));

  const productHits = catalog.products
    .map((product) => {
      const v = catalog.vendors.find((x) => x.id === product.vendorId);
      if (!v) return null;
      const productHaystack = `${product.name} ${product.tag ?? ""} ${
        product.veg ? "veg vegetarian" : "meat chicken egg non-veg nonveg"
      }`.toLowerCase();
      const vendorHaystack = `${v.name} ${v.cuisine} ${v.specialty ?? ""} ${v.tagline ?? ""}`.toLowerCase();
      return { product, vendor: v, productHaystack, vendorHaystack };
    })
    .filter((item): item is NonNullable<typeof item> => {
      if (!item) return false;
      const fullHaystack = `${item.productHaystack} ${item.vendorHaystack}`;
      const allTermsMatch = terms.every(term => fullHaystack.includes(term));
      const atLeastOneProductTerm = terms.some(term => item.productHaystack.includes(term));
      return allTermsMatch && atLeastOneProductTerm;
    })
    .map(({ product, vendor, productHaystack }) => ({
      kind: "product" as const,
      product,
      vendor,
      _score: score(product.name, productHaystack)
    }));

  return [...vendorHits, ...productHits]
    .sort((a, b) => b._score - a._score)
    .map((hit) => {
      const { _score, ...rest } = hit;
      return rest;
    });
}
