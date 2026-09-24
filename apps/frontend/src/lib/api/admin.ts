import { apiClient } from "../api-client";
import { type DemoOrder } from "../orders";
import type { Vendor, PublicUser } from "@tea-and-snacks/shared";

export const adminApi = {
  // Orders
  getOrders: () => apiClient.get<DemoOrder[]>("/api/admin/orders"),
  cancelOrder: (orderId: string, reason?: string) =>
    apiClient.put<{ message: string; order: DemoOrder }>(`/api/admin/orders/${orderId}/cancel`, { reason }),

  // Vendors
  getVendors: () => apiClient.get<Vendor[]>("/api/admin/vendors"),
  createVendor: (data: Partial<Vendor> & { ownerEmail?: string, ownerMobile?: string }) =>
    apiClient.post<{ message: string; requiresOtp?: boolean; email?: string; vendor?: Vendor; defaultAccount?: any }>("/api/admin/vendors", data),
  verifyVendorOtp: (data: { email: string, otp: string }) =>
    apiClient.post<{ message: string; defaultAccount: any }>("/api/admin/vendors/verify-otp", data),
  resendVendorOtp: (email: string) =>
    apiClient.post<{ message: string }>("/api/admin/vendors/resend-otp", { email }),
  updateVendor: (vendorId: string, data: Partial<Vendor>) =>
    apiClient.put<{ message: string; vendor: Vendor }>(`/api/admin/vendors/${vendorId}`, data),
  deleteVendor: (vendorId: string) =>
    apiClient.delete<{ message: string }>(`/api/admin/vendors/${vendorId}`),
};
