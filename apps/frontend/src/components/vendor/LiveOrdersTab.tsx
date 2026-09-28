import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api/vendor";
import {
  statusToneClass,
  vendorSlice,
  orderStatuses,
  type DemoOrder,
  type OrderStatus,
} from "@/lib/orders";
import { useOrderRoomUpdates, useIsSocketConnected } from "@/lib/realtime-client";
import { OrderChat } from "@/components/OrderChat";

const filters = ["New", "Accepted", "Preparing", "Out for Delivery", "Delivered", "All"] as const;
type Filter = (typeof filters)[number];
const EMPTY_ORDERS: DemoOrder[] = [];

function VendorNoteInput({ value, onSave }: { value: string; onSave: (note: string) => void }) {
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

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-2xl p-4 shadow-sm border border-border/50 transition-transform hover:-translate-y-1 ${tone}`}>
      <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">{label}</p>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
    </div>
  );
}

function VendorOrderCard({
  order: o,
  vendorId,
  onChat,
  onViewProof,
  patchStatus,
  statusMutation,
  confirmMutation,
  rejectMutation,
  noteMutation,
}: {
  order: DemoOrder;
  vendorId: string;
  onChat: () => void;
  onViewProof: () => void;
  patchStatus: (id: string, status: OrderStatus) => void;
  statusMutation: any;
  confirmMutation: any;
  rejectMutation: any;
  noteMutation: any;
}) {
  const slice = vendorSlice(o, vendorId);
  
  return (
    <article className="surface-card p-5 shadow-sm hover:shadow-md transition-shadow border border-border/40 overflow-hidden relative">
      {/* Accent bar for unread/new status */}
      {o.status === "New" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-mango" />}
      
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-xl bg-secondary/80 px-3 py-1 font-display text-lg font-bold shadow-sm">
          {o.token}
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold text-lg leading-tight">
            #{o.id} <span className="font-medium text-muted-foreground mx-1">·</span> {o.customer}
          </p>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            {o.phone} <span className="mx-1">·</span> {new Date(o.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onChat}
            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/20"
          >
            Chat
          </button>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${statusToneClass[o.status]}`}
          >
            {o.status}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        {slice.items.map((i, idx) => (
          <div key={i.variantId ? `${i.productId}-${i.variantId}` : i.productId ?? `${i.name}-${idx}`} className="flex justify-between items-center group">
            <span className="text-muted-foreground font-medium flex items-center gap-2">
              <span className="bg-secondary/50 text-foreground px-2 py-0.5 rounded-md text-xs font-bold">{i.qty}×</span>
              <span>{i.emoji} {i.name} {i.variantName ? <span className="text-xs opacity-70">({i.variantName})</span> : ""}</span>
            </span>
            <span className="font-bold text-foreground">₹{i.price * i.qty}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border/50 pt-3 mt-3 font-black text-base">
          <span>Subtotal</span>
          <span className="text-primary">₹{slice.subtotal}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/40 border border-secondary p-3">
        <span className="text-sm font-semibold">
          Payment {o.paymentMethod ? `(${o.paymentMethod})` : ""}:{" "}
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
            onClick={onViewProof}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold"
          >
            View screenshot
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">No screenshot uploaded</span>
        )}
        {(!o.paymentConfirmed && !o.paymentRejected) && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => confirmMutation.mutate(o.id)}
              disabled={confirmMutation.isPending}
              className="rounded-full bg-mint px-3 py-1.5 text-xs font-bold text-mint-foreground hover:opacity-80 active:scale-95 transition-all disabled:opacity-50"
            >
              {confirmMutation.isPending && confirmMutation.variables === o.id ? "..." : "Confirm"}
            </button>
            <button
              onClick={() => rejectMutation.mutate(o.id)}
              disabled={rejectMutation.isPending}
              className="rounded-full bg-chili px-3 py-1.5 text-xs font-bold text-chili-foreground hover:opacity-80 active:scale-95 transition-all disabled:opacity-50"
            >
              {rejectMutation.isPending && rejectMutation.variables === o.id ? "..." : "Reject"}
            </button>
          </div>
        )}
      </div>

      {o.status === "New" ? (
        <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border/30">
          <button
            onClick={() => patchStatus(o.id, "Accepted")}
            disabled={statusMutation.isPending}
            className="rounded-full bg-mint px-5 py-2 text-sm font-bold text-mint-foreground hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
          >
            {statusMutation.isPending && statusMutation.variables?.orderId === o.id && statusMutation.variables?.status === "Accepted" ? "..." : "Accept Order"}
          </button>
          <button
            onClick={() => patchStatus(o.id, "Rejected")}
            disabled={statusMutation.isPending}
            className="rounded-full bg-chili px-5 py-2 text-sm font-bold text-chili-foreground hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
          >
            {statusMutation.isPending && statusMutation.variables?.orderId === o.id && statusMutation.variables?.status === "Rejected" ? "..." : "Reject Order"}
          </button>
        </div>
      ) : o.status === "Rejected" ? (
        <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border/30">
          <span className="rounded-full bg-chili px-4 py-2 text-sm font-bold text-chili-foreground">
            Rejected
          </span>
        </div>
      ) : o.status === "Cancelled" ? (
        <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border/30">
          <span className="rounded-full bg-chili/10 border border-chili/20 px-4 py-2 text-sm font-bold text-chili-ink">
            Cancelled
          </span>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border/30">
          {orderStatuses.filter(s => s !== "New").map((s) => (
            <button
              key={s}
              onClick={() => patchStatus(o.id, s)}
              disabled={statusMutation.isPending}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 ${
                o.status === s
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {statusMutation.isPending && statusMutation.variables?.orderId === o.id && statusMutation.variables?.status === s ? "..." : s}
            </button>
          ))}
        </div>
      )}

      <VendorNoteInput
        value={o.vendorNote ?? ""}
        onSave={(note) => noteMutation.mutate({ orderId: o.id, note })}
      />
    </article>
  );
}

export function LiveOrdersTab({ vendorId, hasAccess }: { vendorId: string; hasAccess: boolean }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("New");
  const [proof, setProof] = useState<DemoOrder | null>(null);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const isSocketConnected = useIsSocketConnected();

  const queryKey = ["vendor-orders", vendorId] as const;

  const ordersQuery = useQuery({
    queryKey,
    queryFn: () => vendorApi.getOrders(vendorId),
    enabled: hasAccess,
    refetchInterval: isSocketConnected ? false : 15_000,
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
    mutationFn: (orderId: string) => vendorApi.confirmPayment(vendorId, orderId),
    onSuccess: onMutationSuccess,
  });
  const rejectMutation = useMutation({
    mutationFn: (orderId: string) => vendorApi.rejectPayment(vendorId, orderId),
    onSuccess: onMutationSuccess,
  });
  const noteMutation = useMutation({
    mutationFn: (input: { orderId: string; note: string }) =>
      vendorApi.addNote(vendorId, input.orderId, input.note),
    onSuccess: onMutationSuccess,
  });

  const orders = ordersQuery.data ?? EMPTY_ORDERS;
  const chatOrder = chatOrderId ? orders.find((o) => o.id === chatOrderId) || null : null;

  const stats = useMemo(() => {
    const live = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled" && o.status !== "Rejected");
    const earned = orders
      .filter((o) => o.paymentConfirmed && o.status !== "Cancelled" && o.status !== "Rejected")
      .reduce((s, o) => s + vendorSlice(o, vendorId).subtotal, 0);
    return {
      live: live.length,
      pending: orders.filter((o) => o.status === "New").length,
      awaitingPay: orders.filter((o) => !o.paymentConfirmed && o.status !== "Cancelled").length,
      earned,
    };
  }, [orders, vendorId]);

  const visible = orders.filter((o) => {
    if (filter === "All") return true;
    return o.status === filter;
  });

  const patchStatus = (id: string, status: OrderStatus) =>
    statusMutation.mutate({ orderId: id, status });
  const mutationError =
    [statusMutation, confirmMutation, rejectMutation].find((m) => m.isError)?.error ?? undefined;

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Live orders" value={String(stats.live)} tone="bg-mint-soft text-mint-ink" />
        <Stat label="New" value={String(stats.pending)} tone="bg-mango-soft text-mango-ink" />
        <Stat
          label="Unverified pay"
          value={String(stats.awaitingPay)}
          tone="bg-chili-soft text-chili-ink"
        />
        <Stat label="Collected" value={`₹${stats.earned}`} tone="bg-sky-soft text-sky-ink" />
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
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-all active:scale-95 ${
              filter === f ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20 ring-offset-2 ring-offset-background" : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {ordersQuery.isLoading ? (
        <p className="mt-8 text-muted-foreground">Loading orders…</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No orders in this view yet.</p>
      ) : (
        <div className="mt-5 grid gap-4">
          {visible.map((o) => (
            <VendorOrderCard
              key={o.id}
              order={o}
              vendorId={vendorId}
              onChat={() => setChatOrderId(o.id)}
              onViewProof={() => setProof(o)}
              patchStatus={patchStatus}
              statusMutation={statusMutation}
              confirmMutation={confirmMutation}
              rejectMutation={rejectMutation}
              noteMutation={noteMutation}
            />
          ))}
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

      {chatOrder && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/70 p-4"
          onClick={() => setChatOrderId(null)}
        >
          <div
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <OrderChat order={chatOrder} isVendor onMessageSent={onMutationSuccess} />
            <button
              onClick={() => setChatOrderId(null)}
              className="mt-4 w-full rounded-full bg-secondary px-4 py-3 font-semibold text-foreground hover:bg-secondary/80 transition-colors"
            >
              Close Chat
            </button>
          </div>
        </div>
      )}
    </>
  );
}
