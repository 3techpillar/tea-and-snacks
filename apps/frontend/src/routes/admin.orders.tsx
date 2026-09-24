import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { useState } from "react";
import { statusToneClass } from "@/lib/orders";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersDashboard,
});

function AdminOrdersDashboard() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"All" | "Pending" | "Live" | "Completed" | "Cancelled">("Live");

  const queryKey = ["admin-orders"];
  const { data: orders = [], isLoading } = useQuery({
    queryKey,
    queryFn: adminApi.getOrders,
    refetchInterval: 10_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => adminApi.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const visibleOrders = orders.filter((o) => {
    if (filter === "All") return true;
    if (filter === "Live") return o.status !== "Completed" && o.status !== "Cancelled";
    return o.status === filter;
  });

  if (isLoading) {
    return <div className="animate-pulse p-4 text-muted-foreground">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Global Orders</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {["Live", "Pending", "Completed", "Cancelled", "All"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-accent/50 text-foreground hover:bg-accent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleOrders.length === 0 ? (
          <p className="col-span-full py-12 text-center text-muted-foreground">
            No orders match the current filter.
          </p>
        ) : (
          visibleOrders.map((order) => {
            const tone = statusToneClass[order.status];
            const vendorId = order.items?.[0]?.vendorId || "Unknown Vendor";
            
            return (
              <div key={order.id} className="flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className={`border-b border-border/50 px-4 py-3 ${tone}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">#{order.token}</span>
                    <span className="rounded-full bg-white/50 px-2 py-0.5 text-xs font-semibold backdrop-blur-md">
                      {order.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium opacity-90">
                    Stall: {vendorId}
                  </div>
                </div>

                <div className="flex-1 p-4">
                  <div className="mb-4">
                    <div className="text-sm font-semibold">{order.customer}</div>
                    <div className="text-xs text-muted-foreground">{order.phone}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(order.placedAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex items-start justify-between gap-2">
                        <span>
                          <span className="mr-1">{item.emoji}</span>
                          <span className="text-muted-foreground">{item.qty}x</span> {item.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 border-t border-border pt-4 flex justify-between font-bold">
                    <span>Total</span>
                    <span>₹{order.total}</span>
                  </div>
                </div>

                <div className="bg-accent/30 p-3 text-right">
                  {order.status !== "Completed" && order.status !== "Cancelled" && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to FORCE CANCEL this order?")) {
                          cancelMutation.mutate(order.id);
                        }
                      }}
                      disabled={cancelMutation.isPending}
                      className="text-xs font-semibold text-destructive hover:underline"
                    >
                      {cancelMutation.isPending ? "Cancelling..." : "Force Cancel Order"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
