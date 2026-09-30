import { useState } from "react";
import { UpiQr } from "@/components/UpiQr";
import { useCatalog } from "@/lib/catalog-client";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api/orders";
import { orderStatuses } from "@/lib/orders";
import { useAuth } from "@/lib/auth-client";
import { useOrderRoomUpdates, useIsSocketConnected } from "@/lib/realtime-client";
import { OrderChat } from "@/components/OrderChat";
import { Loader } from "@/components/Loader";
import { BUILDINGS } from "@tea-and-snacks/shared";

import { OrderHero } from "@/components/orders/OrderHero";
import { OrderStatusTracker } from "@/components/orders/OrderStatusTracker";
import { OrderItemsList } from "@/components/orders/OrderItemsList";
import { DeliveryAddressCard } from "@/components/orders/DeliveryAddressCard";
import { PaymentSection } from "@/components/orders/PaymentSection";

function OrderPage() {
  const { orderId } = Route.useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { vendorById } = useCatalog();
  const queryClient = useQueryClient();
  const [showProof, setShowProof] = useState(false);

  const isSocketConnected = useIsSocketConnected();
  const queryKey = ["orders", orderId] as const;
  const orderQuery = useQuery({
    queryKey,
    queryFn: () => ordersApi.getById(orderId),
    enabled: !!user,
    // Socket.io push keeps this fresh; only poll if the socket disconnects.
    refetchInterval: isSocketConnected ? false : 15_000,
  });

  useOrderRoomUpdates(user ? `order:${orderId}` : undefined, () =>
    queryClient.invalidateQueries({ queryKey }),
  );

  const uploadProof = useMutation({
    mutationFn: (input: { fileName: string; dataUrl: string }) =>
      ordersApi.uploadProof(orderId, input),
    onSuccess: (order) => queryClient.setQueryData(queryKey, order),
  });

  const cancelOrder = useMutation({
    mutationFn: () => ordersApi.cancelOrder(orderId),
    onSuccess: (order) => queryClient.setQueryData(queryKey, order),
  });

  const onUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        uploadProof.mutate({ fileName: file.name, dataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Sign in to view this order</h1>
        <Link
          to="/login"
          search={{ redirect: `/orders/${orderId}` }}
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (orderQuery.isLoading) {
    return <Loader text="Loading order..." />;
  }

  const order = orderQuery.data;
  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Link
          to="/orders"
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          My orders
        </Link>
      </div>
    );
  }

  const payQrs = order.items.reduce(
    (acc, item) => {
      const vendor = item.vendorId ? vendorById(item.vendorId) : undefined;
      if (!vendor) return acc;
      const row = acc.find((a) => a.vendor.id === vendor.id);
      if (row) row.amount += item.price * item.qty;
      else acc.push({ vendor, amount: item.price * item.qty });
      return acc;
    },
    [] as {
      vendor: NonNullable<ReturnType<typeof vendorById>>;
      amount: number;
    }[],
  );

  const isCancelled = order.status === "Cancelled";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <OrderHero order={order} />

      <DeliveryAddressCard order={order} />

      <OrderStatusTracker order={order} isCancelled={isCancelled} />

      {order.status === "New" && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to cancel this order?")) {
                cancelOrder.mutate();
              }
            }}
            disabled={cancelOrder.isPending}
            className="text-sm font-semibold text-destructive hover:underline disabled:opacity-50"
          >
            {cancelOrder.isPending ? "Cancelling..." : "Cancel Order"}
          </button>
        </div>
      )}

      {!isCancelled && (
        <PaymentSection
          order={order}
          payQrs={payQrs}
          uploadProof={uploadProof}
          onUpload={onUpload}
          setShowProof={setShowProof}
        />
      )}

      <OrderItemsList order={order} />

      <OrderChat order={order} />

      {showProof && order.paymentProofUrl && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/70 p-4"
          onClick={() => setShowProof(false)}
        >
          <div
            className="surface-card max-h-[85vh] w-full max-w-md overflow-auto p-4 relative"
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

export const Route = createFileRoute("/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order status — Easy Food" },
      {
        name: "description",
        content: "Track your token number and order status in real time.",
      },
      { property: "og:title", content: "Order status — Easy Food" },
      {
        property: "og:description",
        content: "Track your token number and order status in real time.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});
