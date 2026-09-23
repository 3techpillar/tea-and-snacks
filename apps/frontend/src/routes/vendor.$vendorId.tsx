import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCatalog } from "@/lib/catalog-client";
import { useAuth } from "@/lib/auth-client";
import { useOrderRoomUpdates } from "@/lib/realtime-client";
import { vendorApi } from "@/lib/api/vendor";
import {
  statusToneClass,
  vendorSlice,
  vendorStatuses,
  type DemoOrder,
  type OrderStatus,
} from "@/lib/orders";

export const Route = createFileRoute("/vendor/$vendorId")({
  head: () => ({
    meta: [
      { title: "Stall orders — Easy Food vendor" },
      {
        name: "description",
        content: "Manage live orders, confirm UPI payments and update tokens.",
      },
      { property: "og:title", content: "Stall orders — Easy Food vendor" },
      {
        property: "og:description",
        content: "Manage live orders, confirm UPI payments and update tokens.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VendorDashboard,
});

const filters = ["Live", "Pending", "Preparing", "Ready", "All"] as const;
type Filter = (typeof filters)[number];

// Stable reference so `orders` doesn't change identity every render while
// the query is still loading (a fresh `[]` literal would defeat useMemo).
const EMPTY_ORDERS: DemoOrder[] = [];

function VendorDashboard() {
  const { vendorId } = Route.useParams();
  const { vendorById } = useCatalog();
  const vendor = vendorById(vendorId);
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("Live");
  const [proof, setProof] = useState<DemoOrder | null>(null);

  const hasAccess =
    user?.role === "admin" ||
    (user?.role === "vendor" && user.vendorId === vendorId);
  const queryKey = ["vendor-orders", vendorId] as const;

  const ordersQuery = useQuery({
    queryKey,
    queryFn: () => vendorApi.getOrders(vendorId),
    enabled: hasAccess,
    refetchInterval: 15_000, // fallback if Socket.io never attached (see doc/MONGODB_BACKEND.md)
  });

  useOrderRoomUpdates(hasAccess ? `vendor:${vendorId}` : undefined, () =>
    queryClient.invalidateQueries({ queryKey }),
  );

  const onMutationSuccess = (order: DemoOrder) => {
    queryClient.setQueryData(queryKey, (prev: DemoOrder[] | undefined) =>
      (prev ?? []).map((o) => (o.id === order.id ? order : o)),
    );
  };

  const statusMutation = useMutation({
    mutationFn: (input: { orderId: string; status: OrderStatus }) =>
      vendorApi.updateStatus(vendorId, input.orderId, input.status),
    onSuccess: onMutationSuccess,
  });
  const confirmMutation = useMutation({
    mutationFn: (orderId: string) =>
      vendorApi.confirmPayment(vendorId, orderId),
    onSuccess: onMutationSuccess,
  });
  const rejectMutation = useMutation({
    mutationFn: (orderId: string) =>
      vendorApi.rejectPayment(vendorId, orderId),
    onSuccess: onMutationSuccess,
  });
  const noteMutation = useMutation({
    mutationFn: (input: { orderId: string; note: string }) =>
      vendorApi.addNote(vendorId, input.orderId, input.note),
    onSuccess: onMutationSuccess,
  });

  const orders = ordersQuery.data ?? EMPTY_ORDERS;

  const stats = useMemo(() => {
    const live = orders.filter(
      (o) => o.status !== "Completed" && o.status !== "Cancelled",
    );
    const earned = orders
      .filter((o) => o.paymentConfirmed && o.status !== "Cancelled")
      .reduce((s, o) => s + vendorSlice(o, vendorId).subtotal, 0);
    return {
      live: live.length,
      pending: orders.filter((o) => o.status === "Pending").length,
      awaitingPay: orders.filter(
        (o) => !o.paymentConfirmed && o.status !== "Cancelled",
      ).length,
      earned,
    };
  }, [orders, vendorId]);

  const visible = orders.filter((o) => {
    if (filter === "All") return true;
    if (filter === "Live")
      return o.status !== "Completed" && o.status !== "Cancelled";
    return o.status === filter;
  });

  if (!vendor) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Stall not found</h1>
        <Link
          to="/vendor"
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          All stalls
        </Link>
      </div>
    );
  }

  if (!authLoading && !hasAccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Sign in as this stall's vendor</h1>
        <p className="mt-2 text-muted-foreground">
          {user
            ? "Your account doesn't manage this stall."
            : "You need to sign in with this stall's vendor account."}
        </p>
        <Link
          to="/login"
          search={{ redirect: `/vendor/${vendorId}` }}
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const patchStatus = (id: string, status: OrderStatus) =>
    statusMutation.mutate({ orderId: id, status });
  const mutationError =
    [statusMutation, confirmMutation, rejectMutation].find((m) => m.isError)
      ?.error ?? undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl gradient-hero text-2xl">
          {vendor.emoji}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Vendor dashboard
          </p>
          <h1 className="truncate font-display text-2xl font-bold">
            {vendor.name}
          </h1>
        </div>
        <Link
          to="/vendor"
          className="ml-auto rounded-full border border-border px-3 py-2 text-xs font-semibold"
        >
          Switch
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Live orders"
          value={String(stats.live)}
          tone="bg-mint-soft text-mint-ink"
        />
        <Stat
          label="New"
          value={String(stats.pending)}
          tone="bg-mango-soft text-mango-ink"
        />
        <Stat
          label="Unverified pay"
          value={String(stats.awaitingPay)}
          tone="bg-chili-soft text-chili-ink"
        />
        <Stat
          label="Collected"
          value={`₹${stats.earned}`}
          tone="bg-sky-soft text-sky-ink"
        />
      </div>

      {mutationError instanceof Error && (
        <p className="mt-3 rounded-xl bg-chili-soft px-4 py-2 text-sm font-semibold text-chili-ink">
          {mutationError.message}
        </p>
      )}

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {ordersQuery.isLoading ? (
        <p className="mt-8 text-muted-foreground">Loading orders…</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          No orders in this view yet.
        </p>
      ) : (
        <div className="mt-5 grid gap-4">
          {visible.map((o) => {
            const slice = vendorSlice(o, vendorId);
            return (
              <article key={o.id} className="surface-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-xl bg-secondary px-3 py-1 font-display text-lg font-bold">
                    {o.token}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      #{o.id} · {o.customer}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {o.phone} · {new Date(o.placedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <span
                    className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${statusToneClass[o.status]}`}
                  >
                    {o.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-sm">
                  {slice.items.map((i, idx) => (
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
                  <div className="flex justify-between border-t border-border pt-2 font-bold">
                    <span>Your subtotal</span>
                    <span>₹{slice.subtotal}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-secondary/60 p-3">
                  <span className="text-sm font-semibold">
                    Payment:{" "}
                    <span
                      className={
                        o.paymentConfirmed
                          ? "text-mint-ink"
                          : o.paymentRejected
                            ? "text-chili-ink"
                            : "text-muted-foreground"
                      }
                    >
                      {o.paymentConfirmed
                        ? "Confirmed"
                        : o.paymentRejected
                          ? "Rejected"
                          : "Awaiting check"}
                    </span>
                  </span>
                  {o.paymentProofUrl ? (
                    <button
                      onClick={() => setProof(o)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold"
                    >
                      View screenshot
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No screenshot uploaded
                    </span>
                  )}
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={() => confirmMutation.mutate(o.id)}
                      className="rounded-full bg-mint px-3 py-1.5 text-xs font-bold text-mint-foreground"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(o.id)}
                      className="rounded-full bg-chili px-3 py-1.5 text-xs font-bold text-chili-foreground"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {vendorStatuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => patchStatus(o.id, s)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        o.status === s
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <VendorNoteInput
                  value={o.vendorNote ?? ""}
                  onSave={(note) =>
                    noteMutation.mutate({ orderId: o.id, note })
                  }
                />
              </article>
            );
          })}
        </div>
      )}

      {proof && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/70 p-4"
          onClick={() => setProof(null)}
        >
          <div
            className="surface-card max-h-[85vh] w-full max-w-md overflow-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold">
              Payment proof · #{proof.id} ({proof.customer})
            </p>
            <img
              src={proof.paymentProofUrl}
              alt={`Payment screenshot for order ${proof.id}`}
              className="mt-3 w-full rounded-xl object-contain"
            />
            <button
              onClick={() => setProof(null)}
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

function VendorNoteInput({
  value,
  onSave,
}: {
  value: string;
  onSave: (note: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onSave(draft)}
      placeholder="Note for the customer (e.g. 5 min delay)"
      className="mt-3 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl p-3 ${tone}`}>
      <p className="text-xs font-semibold opacity-80">{label}</p>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
    </div>
  );
}
