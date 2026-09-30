import { apiClient } from "../api-client";
import type { PublicOrder, DeliveryAddress } from "@tea-and-snacks/shared";

export const ordersApi = {
  place: (data: {
    customerName: string;
    customerPhone: string;
    paymentMethod: "online" | "offline";
    deliveryAddress: DeliveryAddress;
    items: { productId: string; variantId?: string; qty: number }[];
  }) => apiClient.post<PublicOrder>("/api/orders", data),

  list: () => apiClient.get<PublicOrder[]>("/api/orders"),

  getById: (orderId: string) =>
    apiClient.get<PublicOrder | null>(`/api/orders/${orderId}`),

  uploadProof: (orderId: string, data: { fileName: string; dataUrl: string }) =>
    apiClient.post<PublicOrder>(`/api/orders/${orderId}/proof`, data),

  addChatMessage: (orderId: string, text: string) =>
    apiClient.post<PublicOrder>(`/api/orders/${orderId}/chat`, { text }),

  cancelOrder: (orderId: string, reason?: string) =>
    apiClient.post<PublicOrder>(`/api/orders/${orderId}/cancel`, { reason }),
};
