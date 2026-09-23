import { queryOptions, useQuery } from "@tanstack/react-query";
import { getCatalogFn } from "@/lib/api/catalog";
import {
  productsByVendor,
  vendorById,
  type Product,
  type Vendor,
  type Offer,
} from "@/lib/data";

export const catalogQueryOptions = queryOptions({
  queryKey: ["catalog"] as const,
  queryFn: () => getCatalogFn(),
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
    vendorById: (id: string) => vendorById(catalog.vendors, id),
    productsByVendor: (vendorId: string) =>
      productsByVendor(catalog.products, vendorId),
  };
}
