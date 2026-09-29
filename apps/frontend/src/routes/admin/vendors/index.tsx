import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { useState } from "react";
import type { Vendor } from "@tea-and-snacks/shared";
import { Plus } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/DataTable";

export const Route = createFileRoute("/admin/vendors/")({
  component: AdminVendorsDashboard,
});

function AdminVendorsDashboard() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const queryKey = ["admin-vendors", page, limit];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => adminApi.getVendors(page, limit),
  });

  const vendors = data?.data || [];
  const meta = data?.meta;

  const deleteMutation = useMutation({
    mutationFn: (vendorId: string) => adminApi.deleteVendor(vendorId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-vendors"] }),
  });

  const columns: ColumnDef<Vendor>[] = [
    {
      header: "Stall",
      className: "w-[300px]",
      cell: (v) => {
        const vendorId = v.id || (v as any)._id;
        return (
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent text-xl">
              {v.imageUrl ? (
                <img src={v.imageUrl} alt="" className="h-full w-full rounded-lg object-cover" />
              ) : (
                v.emoji
              )}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate">{v.name}</div>
              <div className="text-xs text-muted-foreground truncate">{vendorId}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Cuisine",
      accessorKey: "cuisine",
    },
    {
      header: "Status",
      cell: (v) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
            v.isActive !== false ? "bg-mint-soft text-mint-ink" : "bg-destructive/20 text-destructive"
          }`}
        >
          {v.isActive !== false ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Counter",
      accessorKey: "counter",
      className: "text-muted-foreground",
    },
    {
      header: "Actions",
      cell: (v) => {
        const vendorId = v.id || (v as any)._id;
        return (
          <div className="flex items-center gap-3">
            <Link
              to={`/admin/vendors/${vendorId}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              Edit
            </Link>
            <button
              onClick={() => {
                if (confirm(`Deactivate ${v.name}?`)) {
                  deleteMutation.mutate(vendorId);
                }
              }}
              disabled={deleteMutation.isPending || v.isActive === false}
              className="text-xs font-medium text-destructive hover:underline disabled:opacity-50 disabled:hover:no-underline"
            >
              Deactivate
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Manage Vendors</h1>
        <Link
          to="/admin/vendors/create"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Stall
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={vendors}
        isLoading={isLoading}
        emptyMessage="No vendors found. Add a new stall!"
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
