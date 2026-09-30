import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api/orders";
import { adminApi } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth-client";
import { useCatalog } from "@/lib/catalog-client";
import { useOrderRoomUpdates, useIsSocketConnected } from "@/lib/realtime-client";
import { OrderChat } from "@/components/OrderChat";
import { Loader } from "@/components/Loader";
import { ArrowLeft } from "lucide-react";

import { OrderHero } from "@/components/orders/OrderHero";
import { OrderStatusTracker } from "@/components/orders/OrderStatusTracker";
import { OrderItemsList } from "@/components/orders/OrderItemsList";
import { DeliveryAddressCard } from "@/components/orders/DeliveryAddressCard";

function AdminOrderDetailsPage() {
  const { orderId } = Route.useParams();
  const { user } = useAuth();
  const { vendorById } = useCatalog();
  const queryClient = useQueryClient();
  const [showProof, setShowProof] = useState(false);

  const isSocketConnected = useIsSocketConnected();
  const queryKey = ["orders", orderId] as const;
  const orderQuery = useQuery({
    queryKey,
    queryFn: () => ordersApi.getById(orderId),
    enabled: !!user,
    refetchInterval: isSocketConnected ? false : 15_000,
  });

  useOrderRoomUpdates(user ? `order:${orderId}` : undefined, () =>
    queryClient.invalidateQueries({ queryKey }),
  );

  const cancelOrder = useMutation({
    mutationFn: () => adminApi.cancelOrder(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  if (orderQuery.isLoading) {
    return <Loader text="Loading order details..." />;
  }

  const order = orderQuery.data;
  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Link
          to="/admin/orders"
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === "Cancelled";
  
  const vendorId = order.items?.[0]?.vendorId;
  const vendor = vendorId ? vendorById(vendorId) : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/orders"
          className="inline-flex items-center justify-center rounded-full bg-accent p-2 text-muted-foreground transition-colors hover:bg-accent/80 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
      </div>

      <OrderHero order={order} />

      <DeliveryAddressCard order={order} />

      {vendor && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Vendor Details</h2>
            <Link
              to={`/admin/vendors/${vendor.id}`}
              className="text-sm font-semibold text-primary hover:underline"
            >
              View
            </Link>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-semibold">{vendor.name} {vendor.emoji}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ID (Slug):</span>
              <span className="font-semibold text-primary">{vendor.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Location:</span>
              <span className="font-semibold">
                Stall {vendor.location?.stallNumber || "N/A"} 
                {vendor.location?.floor ? `, ${vendor.location.floor} Floor` : ""}
              </span>
            </div>
          </div>
        </div>
      )}

      <OrderStatusTracker order={order} isCancelled={isCancelled} />

      {order.status !== "Delivered" && !isCancelled && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to FORCE CANCEL this order?")) {
                cancelOrder.mutate();
              }
            }}
            disabled={cancelOrder.isPending}
            className="text-sm font-semibold text-destructive hover:underline disabled:opacity-50"
          >
            {cancelOrder.isPending ? "Cancelling..." : "Force Cancel Order"}
          </button>
        </div>
      )}

      {order.paymentMethod === "online" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4">Payment Info</h2>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Payment Method:</span>
            <span className="font-semibold uppercase text-primary">Online (UPI)</span>
          </div>
          {order.paymentProofUrl ? (
            <div className="mt-4 border-t border-border pt-4">
              <span className="text-sm text-muted-foreground block mb-2">Payment Proof uploaded:</span>
              <button 
                onClick={() => setShowProof(true)}
                className="text-sm font-semibold text-primary hover:underline"
              >
                View Screenshot ({order.paymentProofName})
              </button>
            </div>
          ) : (
            <div className="mt-4 border-t border-border pt-4 text-sm text-amber-600 font-medium">
              No payment screenshot uploaded yet.
            </div>
          )}
        </div>
      )}

      {order.paymentMethod === "offline" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-2">Payment Info</h2>
          <div className="flex items-center justify-between text-amber-600 font-semibold">
            <span>Payment Method:</span>
            <span>Cash on Delivery</span>
          </div>
        </div>
      )}

      <OrderItemsList order={order} />

      <OrderChat order={order} />

      {showProof && order.paymentProofUrl && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/70 p-4"
          onClick={() => setShowProof(false)}
        >
          <div
            className="surface-card max-h-[85vh] w-full max-w-md overflow-auto p-4 relative bg-card rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowProof(false)}
              className="absolute top-2 right-2 p-2 bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
            >
              ✕
            </button>
            <p className="font-semibold mt-2">
              Payment proof · #{order.id}
            </p>
            <img
              src={order.paymentProofUrl}
              alt={`Payment screenshot for order ${order.id}`}
              className="mt-3 w-full rounded-xl object-contain"
            />
            <button
              onClick={() => setShowProof(false)}
              className="mt-4 w-full rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/admin/orders_/$orderId")({
  component: AdminOrderDetailsPage,
});
