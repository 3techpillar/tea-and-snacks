import { UpiQr } from "@/components/UpiQr";
import { useCatalog } from "@/lib/catalog-client";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getOrderFn, uploadPaymentProofFn } from "@/lib/api/orders";
import { orderStatuses } from "@/lib/orders";
import { useAuth } from "@/lib/auth-client";
import { useOrderRoomUpdates } from "@/lib/realtime-client";

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

function OrderPage() {
  const { orderId } = Route.useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { vendorById } = useCatalog();
  const queryClient = useQueryClient();

  const queryKey = ["orders", orderId] as const;
  const orderQuery = useQuery({
    queryKey,
    queryFn: () => getOrderFn({ data: { orderId } }),
    enabled: !!user,
    // Socket.io push (below) keeps this fresh instantly when it's attached;
    // this poll is only the fallback if a build target never wires it up.
    refetchInterval: 15_000,
  });

  useOrderRoomUpdates(user ? `order:${orderId}` : undefined, () =>
    queryClient.invalidateQueries({ queryKey }),
  );

  const uploadProof = useMutation({
    mutationFn: (input: { fileName: string; dataUrl: string }) =>
      uploadPaymentProofFn({ data: { orderId, ...input } }),
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
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-muted-foreground">
        Loading…
      </div>
    );
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
  const isCompleted = order.status === "Completed";
  const stepIndex = isCompleted
    ? orderStatuses.length - 1
    : orderStatuses.indexOf(order.status);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <section className="rounded-3xl gradient-hero px-6 py-8 text-primary-foreground">
        <p className="text-sm uppercase tracking-[0.2em] opacity-90">
          Order confirmed
        </p>
        <h1 className="mt-2 text-3xl font-bold">Token {order.token}</h1>
        <p className="mt-1 opacity-90">
          Order #{order.id} · {order.customer}
        </p>
      </section>

      <section className="surface-card mt-6 p-5">
        <h2 className="text-lg font-semibold">Status</h2>
        {isCancelled ? (
          <p className="mt-3 rounded-xl bg-chili-soft px-4 py-3 text-sm font-semibold text-chili-ink">
            This order was cancelled.
            {order.vendorNote ? ` ${order.vendorNote}` : ""}
          </p>
        ) : (
          <div className="mt-4 flex items-center gap-2">
            {orderStatuses.map((s, i) => (
              <div key={s} className="flex-1">
                <div
                  className={`h-2 rounded-full ${i <= stepIndex ? "bg-mint" : "bg-secondary"}`}
                />
                <p
                  className={`mt-2 text-xs font-semibold ${
                    i <= stepIndex ? "text-mint-ink" : "text-muted-foreground"
                  }`}
                >
                  {s}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {!isCancelled && (
        <section className="surface-card mt-5 p-5">
          <h2 className="text-lg font-semibold">Payment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Scan the stall QR below to pay ₹{order.total}, then upload the
            screenshot.
          </p>

          {!order.paymentConfirmed && (
            <div className="mt-4 grid gap-3">
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
          <label className="mt-4 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-border px-4 py-6 text-center">
            {order.paymentProofUrl ? (
              <img
                src={order.paymentProofUrl}
                alt={`Payment screenshot for order ${order.id}`}
                className="max-h-64 w-full rounded-xl object-contain"
              />
            ) : (
              <span className="text-2xl">📸</span>
            )}
            <span className="mt-2 text-sm font-semibold">
              {uploadProof.isPending
                ? "Uploading…"
                : order.paymentProofName
                  ? `Uploaded: ${order.paymentProofName} · tap to replace`
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
            <a
              href={order.paymentProofUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-primary underline"
            >
              Open full screenshot
            </a>
          )}
          <p className="mt-3 text-sm">
            Vendor confirmation:{" "}
            <span
              className={
                order.paymentConfirmed
                  ? "font-semibold text-mint-ink"
                  : "text-muted-foreground"
              }
            >
              {order.paymentConfirmed
                ? "Payment confirmed"
                : order.paymentRejected
                  ? "Payment rejected — please re-upload"
                  : "Awaiting confirmation"}
            </span>
          </p>
          {order.vendorNote && (
            <p className="mt-2 rounded-xl bg-mango-soft px-3 py-2 text-sm text-mango-ink">
              Note from vendor: {order.vendorNote}
            </p>
          )}
        </section>
      )}

      <section className="surface-card mt-5 p-5">
        <h2 className="text-lg font-semibold">Items</h2>
        <div className="mt-3 space-y-2 text-sm">
          {order.items.map((i, idx) => (
            <div
              key={i.productId ?? `${i.name}-${idx}`}
              className="flex justify-between"
            >
              <span className="text-muted-foreground">
                {i.qty} × {i.emoji} {i.name}
              </span>
              <span className="font-semibold">₹{i.price * i.qty}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t border-border pt-3 font-bold">
          <span>Total</span>
          <span>₹{order.total}</span>
        </div>
      </section>
    </div>
  );
}
