import { apiClient } from "../api-client";
import type { DemoOrder, OrderStatus } from "@tea-and-snacks/shared";

export const vendorApi = {
  getOrders: (vendorId: string) =>
    apiClient.get<DemoOrder[]>(`/api/vendor/${vendorId}/orders`),

  getStats: (vendorId: string) =>
    apiClient.get<{
      live: number;
      pending: number;
      awaitingPay: number;
      earned: number;
    }>(`/api/vendor/${vendorId}/stats`),

  updateStatus: (vendorId: string, orderId: string, status: OrderStatus) =>
    apiClient.patch<DemoOrder>(
      `/api/vendor/${vendorId}/orders/${orderId}/status`,
      { status },
    ),

  confirmPayment: (vendorId: string, orderId: string) =>
    apiClient.post<DemoOrder>(
      `/api/vendor/${vendorId}/orders/${orderId}/confirm-payment`,
    ),

  rejectPayment: (vendorId: string, orderId: string) =>
    apiClient.post<DemoOrder>(
      `/api/vendor/${vendorId}/orders/${orderId}/reject-payment`,
    ),

  addNote: (vendorId: string, orderId: string, note: string) =>
    apiClient.patch<DemoOrder>(
      `/api/vendor/${vendorId}/orders/${orderId}/note`,
      { note },
    ),
    
  createProduct: (vendorId: string, data: any) =>
    apiClient.post(`/api/vendor/${vendorId}/products`, data),
  updateProduct: (vendorId: string, productId: string, data: any) =>
    apiClient.put(`/api/vendor/${vendorId}/products/${productId}`, data),
  deleteProduct: (vendorId: string, productId: string) =>
    apiClient.delete(`/api/vendor/${vendorId}/products/${productId}`),
};
