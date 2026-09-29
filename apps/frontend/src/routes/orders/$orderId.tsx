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



function OrderHero({ order }: { order: any }) {
  return (
    <section className="rounded-3xl gradient-hero px-8 py-10 text-primary-foreground shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
      <div className="relative z-10">
        <p className="text-xs uppercase tracking-[0.25em] opacity-80 font-bold mb-2">
          Order Confirmed
        </p>
        <h1 className="text-4xl font-black tracking-tight drop-shadow-sm">Token {order.token}</h1>
        <p className="mt-2 opacity-90 font-medium text-lg">
          Order #{order.id} <span className="mx-1 opacity-50">·</span> {order.customer}
        </p>
      </div>
    </section>
  );
}

function OrderStatusTracker({ order, isCancelled }: { order: any; isCancelled: boolean }) {
  const isCompleted = order.status === "Delivered";
  const stepIndex = isCompleted
    ? orderStatuses.length - 1
    : orderStatuses.indexOf(order.status);

  return (
    <section className="surface-card mt-6 p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
      <h2 className="text-lg font-bold tracking-tight">Status</h2>
      {isCancelled ? (
        <p className="mt-4 rounded-xl bg-chili/10 border border-chili/20 px-5 py-4 text-sm font-semibold text-chili-ink shadow-sm">
          This order was cancelled.
          {order.cancellationReason ? <span className="block mt-1 font-normal opacity-80">Reason: {order.cancellationReason}</span> : order.vendorNote ? <span className="block mt-1 font-normal opacity-80">{order.vendorNote}</span> : ""}
        </p>
      ) : (
        <div className="mt-6 flex items-center gap-2">
          {orderStatuses.map((s, i) => (
            <div key={s} className="flex-1 group">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ease-out shadow-inner ${i <= stepIndex ? "bg-mint scale-y-100" : "bg-secondary scale-y-90"}`}
              />
              <p
                className={`mt-3 text-xs font-bold transition-colors duration-300 ${
                  i <= stepIndex ? "text-mint-ink" : "text-muted-foreground/60"
                }`}
              >
                {s}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function OrderItemsList({ order }: { order: any }) {
  return (
    <section className="surface-card mt-6 p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
      <h2 className="text-lg font-bold tracking-tight">Items</h2>
      <div className="mt-4 space-y-3 text-sm">
        {order.items.map((i: any, idx: number) => (
          <div
            key={i.variantId ? `${i.productId}-${i.variantId}` : i.productId ?? `${i.name}-${idx}`}
            className="flex justify-between items-center group"
          >
            <span className="text-muted-foreground font-medium flex items-center gap-2">
              <span className="bg-secondary/70 text-foreground px-2 py-0.5 rounded-md text-xs font-bold">{i.qty}×</span>
              <span>{i.emoji} {i.name} {i.variantName ? <span className="text-xs opacity-70">({i.variantName})</span> : ""}</span>
            </span>
            <span className="font-bold text-foreground">₹{i.price * i.qty}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between border-t border-border/50 pt-4 font-black text-base">
        <span>Total</span>
        <span className="text-primary">₹{order.total}</span>
      </div>
    </section>
  );
}

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
        <section className="surface-card mt-6 p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-bold tracking-tight">Payment</h2>
          {order.paymentMethod === "offline" ? (
            <p className="mt-2 text-sm text-muted-foreground font-medium">
              Please pay ₹{order.total} at the stall.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground font-medium">
                Scan the stall QR below to pay ₹{order.total}, then upload the
                screenshot.
              </p>

          {!order.paymentConfirmed && (
            <div className="mt-5 grid gap-4">
              {payQrs.map(({ vendor, amount }) => (
                <UpiQr
                  key={vendor.id}
                  vendor={vendor}
                  amount={amount}
                  note={`Easy Food order ${order.id}`}
                />
              ))}
            </div>
          )}
          <label className="mt-6 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 px-6 py-8 text-center group">
            {order.paymentProofUrl ? (
              <img
                src={order.paymentProofUrl}
                alt={`Payment screenshot for order ${order.id}`}
                className="max-h-64 w-full rounded-xl object-contain shadow-sm border border-border/50"
              />
            ) : (
              <div className="p-4 bg-background rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl block">📸</span>
              </div>
            )}
            <span className="mt-4 text-sm font-bold text-primary group-hover:text-primary/80 transition-colors">
              {uploadProof.isPending
                ? "Uploading…"
                : order.paymentProofName
                  ? `Uploaded: ${order.paymentProofName} · Tap to replace`
                  : "Upload payment screenshot"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onUpload(e.target.files?.[0])}
            />
          </label>
          {uploadProof.isError && (
            <p className="mt-2 text-sm font-medium text-destructive">
              {uploadProof.error instanceof Error
                ? uploadProof.error.message
                : "Upload failed."}
            </p>
          )}
          {order.paymentProofUrl && (
            <button
              onClick={() => setShowProof(true)}
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Open full screenshot
            </button>
          )}
          <div className="mt-5 p-4 rounded-xl bg-secondary/30 border border-secondary flex flex-col gap-1">
            <p className="text-sm font-medium">
              Payment Status:{" "}
              <span
                className={
                  order.paymentConfirmed || order.paymentProofUrl
                    ? "font-bold text-mint-ink"
                    : "font-semibold text-muted-foreground"
                }
              >
                {order.paymentConfirmed
                  ? "Payment confirmed"
                  : order.paymentRejected
                    ? "Payment rejected — please re-upload"
                    : order.paymentProofUrl
                      ? "Paid (Pending vendor check)"
                      : "Awaiting payment"}
              </span>
            </p>
          </div>
          {order.vendorNote && (
            <p className="mt-3 rounded-xl bg-mango/10 border border-mango/20 px-4 py-3 text-sm font-medium text-mango-ink shadow-sm">
              <span className="font-bold block mb-0.5">Note from vendor:</span> {order.vendorNote}
            </p>
          )}
        </>
      )}
        </section>
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
