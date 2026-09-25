import { apiClient } from "../api-client";
import type { Catalog } from "@tea-and-snacks/shared";

export type { Catalog };

export const catalogApi = {
  getCatalog: () => apiClient.get<Catalog>("/api/catalog"),
  searchCatalog: (q: string) => apiClient.get<any[]>(`/api/catalog/search?q=${encodeURIComponent(q)}`),
};
