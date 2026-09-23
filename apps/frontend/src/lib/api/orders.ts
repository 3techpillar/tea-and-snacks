import { apiClient } from "../api-client";
import type { DemoOrder } from "@tea-and-snacks/shared";

export const ordersApi = {
  place: (data: {
    customerName: string;
    customerPhone: string;
    items: { productId: string; qty: number }[];
  }) => apiClient.post<DemoOrder>("/api/orders", data),

  list: () => apiClient.get<DemoOrder[]>("/api/orders"),

  getById: (orderId: string) =>
    apiClient.get<DemoOrder | null>(`/api/orders/${orderId}`),

  uploadProof: (orderId: string, data: { fileName: string; dataUrl: string }) =>
    apiClient.post<DemoOrder>(`/api/orders/${orderId}/proof`, data),
};
