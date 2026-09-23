import { queryOptions, useQuery } from "@tanstack/react-query";
import { catalogApi } from "@/lib/api/catalog";
import type { Product, Vendor, Offer } from "@tea-and-snacks/shared";

export { type Product, type Vendor, type Offer };

export const catalogQueryOptions = queryOptions({
  queryKey: ["catalog"] as const,
  queryFn: () => catalogApi.getCatalog(),
  staleTime: 5 * 60_000,
});

const emptyCatalog = {
  vendors: [] as Vendor[],
  products: [] as Product[],
  offers: [] as Offer[],
};

/**
 * The root route's loader prefetches this query (see src/routes/__root.tsx),
 * so by the time any component calls useCatalog() the data is already in the
 * cache — no loading flash on first paint.
 */
export function useCatalog() {
  const { data, isLoading } = useQuery(catalogQueryOptions);
  const catalog = data ?? emptyCatalog;

  return {
    ...catalog,
    isLoading,
    vendorById: (id: string) => catalog.vendors.find((v) => v.id === id),
    productsByVendor: (vendorId: string) =>
      catalog.products.filter((p) => p.vendorId === vendorId),
  };
}
