import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { useState } from "react";
import { statusToneClass, type DemoOrder } from "@/lib/orders";
import { DataTable, type ColumnDef } from "@/components/DataTable";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersDashboard,
});

function AdminOrdersDashboard() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filter, setFilter] = useState<"All" | "Pending" | "Live" | "Completed" | "Cancelled">("Live");

  const queryKey = ["admin-orders", page, limit, filter];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => adminApi.getOrders(page, limit, filter),
    refetchInterval: 10_000,
  });

  const orders = data?.data || [];
  const meta = data?.meta;

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => adminApi.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const columns: ColumnDef<DemoOrder>[] = [
    {
      header: "Token",
      className: "w-[80px] font-bold text-lg",
      accessorKey: "token",
    },
    {
      header: "Order ID",
      className: "font-mono text-xs text-muted-foreground",
      accessorKey: "id",
    },
    {
      header: "Date",
      cell: (o) => (
        <span className="text-sm">
          {new Date(o.placedAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      header: "Customer",
      cell: (o) => (
        <div>
          <div className="font-semibold">{o.customer}</div>
          <div className="text-xs text-muted-foreground">{o.phone}</div>
        </div>
      ),
    },
    {
      header: "Stall",
      cell: (o) => {
        const vendorId = o.items?.[0]?.vendorId || "Unknown Vendor";
        return <span className="font-medium text-primary">{vendorId}</span>;
      },
    },
    {
      header: "Status",
      cell: (o) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusToneClass[o.status]}`}>
          {o.status}
        </span>
      ),
    },
    {
      header: "Total",
      cell: (o) => <span className="font-bold">₹{o.total}</span>,
    },
    {
      header: "Actions",
      cell: (o) => (
        <div className="flex gap-2">
          {o.status !== "Completed" && o.status !== "Cancelled" && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to FORCE CANCEL this order?")) {
                  cancelMutation.mutate(o.id);
                }
              }}
              disabled={cancelMutation.isPending}
              className="text-xs font-medium text-destructive hover:underline disabled:opacity-50 disabled:hover:no-underline"
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Global Orders</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {["Live", "Pending", "Completed", "Cancelled", "All"].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f as any);
              setPage(1); // Reset page on filter change
            }}
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

      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        emptyMessage="No orders found."
        pageIndex={meta?.page}
        pageCount={meta?.totalPages}
        onPageChange={setPage}
        limit={limit}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1); // Reset page on limit change
        }}
      />
    </div>
  );
}
