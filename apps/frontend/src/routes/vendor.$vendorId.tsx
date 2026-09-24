import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCatalog } from "@/lib/catalog-client";
import { useAuth } from "@/lib/auth-client";
import { useOrderRoomUpdates } from "@/lib/realtime-client";
import { vendorApi } from "@/lib/api/vendor";
import { Plus, X, Upload } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"orders" | "menu">("orders");

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

      <div className="mt-5 mb-6 border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("orders")}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === "orders" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            Live Orders
          </button>
          <button
            onClick={() => setActiveTab("menu")}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === "menu" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            Menu Management
          </button>
        </nav>
      </div>

      {activeTab === "orders" && (
        <>
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
      </>
      )}

      {activeTab === "menu" && (
        <MenuManagementTab vendorId={vendorId} />
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

function MenuManagementTab({ vendorId }: { vendorId: string }) {
  const { products } = useCatalog();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const vendorProducts = products.filter(p => p.vendorId === vendorId);

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => vendorApi.deleteProduct(vendorId, productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog"] }),
  });

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Manage Menu</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {vendorProducts.map(p => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{p.emoji}</span>
              <div>
                <h3 className="font-bold">{p.name}</h3>
                <p className="text-sm text-muted-foreground">₹{p.price}</p>
                {p.tag && <span className="mt-1 inline-block rounded-full bg-accent px-2 py-0.5 text-xs">{p.tag}</span>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.isAvailable !== false ? "bg-mint-soft text-mint-ink" : "bg-destructive/20 text-destructive"}`}>
                {p.isAvailable !== false ? "Available" : "Out of Stock"}
              </span>
              <button 
                onClick={() => {
                  if (confirm(`Remove ${p.name}?`)) {
                    deleteMutation.mutate(p.id);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="text-xs font-medium text-destructive hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {vendorProducts.length === 0 && (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            No items in your menu. Add some food!
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddProductModal vendorId={vendorId} onClose={() => setIsAddModalOpen(false)} />
      )}
    </div>
  );
}

function AddProductModal({ vendorId, onClose }: { vendorId: string, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    id: "", name: "", price: "", emoji: "🍲", veg: true, tag: ""
  });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let imageUrl = "";
      if (file) {
        const formDataUpload = new FormData();
        formDataUpload.append("image", file);
        const API_BASE = import.meta.env.VITE_API_URL ?? "";
        const res = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          body: formDataUpload,
          credentials: "include"
        });
        if (!res.ok) throw new Error("Image upload failed");
        const json = await res.json();
        imageUrl = json.data?.imageUrl || json.imageUrl;
      }

      await vendorApi.createProduct(vendorId, {
        ...formData,
        price: Number(formData.price),
        imageUrl
      });

      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create product");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add Menu Item</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        {error && <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Item ID (slug)</label>
              <input required value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. veg-momo" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Veg Momos" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Price (₹)</label>
              <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="80" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Emoji</label>
              <input required value={formData.emoji} onChange={e => setFormData({...formData, emoji: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="🥟" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Dietary</label>
              <select value={formData.veg ? "veg" : "non-veg"} onChange={e => setFormData({...formData, veg: e.target.value === "veg"})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="veg">Veg</option>
                <option value="non-veg">Non-Veg</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tag (Optional)</label>
              <input value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Bestseller" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Item Image (Optional)</label>
            <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-border px-6 py-4 transition-colors hover:bg-accent/30">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <div className="mt-2 text-sm text-muted-foreground">
                  <label className="relative cursor-pointer rounded-md font-semibold text-primary hover:underline">
                    <span>Upload a file</span>
                    <input type="file" className="sr-only" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                {file && <p className="mt-1 text-xs text-foreground font-medium">{file.name}</p>}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isSubmitting ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
