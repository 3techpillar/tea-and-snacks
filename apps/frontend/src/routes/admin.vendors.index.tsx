import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { useState } from "react";
import type { Vendor } from "@tea-and-snacks/shared";
import { Plus, X, Upload } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/vendors/")({
  component: AdminVendorsDashboard,
});

function AdminVendorsDashboard() {
  const queryClient = useQueryClient();

  const queryKey = ["admin-vendors"];
  const { data: vendors = [], isLoading } = useQuery({
    queryKey,
    queryFn: adminApi.getVendors,
  });

  const deleteMutation = useMutation({
    mutationFn: (vendorId: string) => adminApi.deleteVendor(vendorId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  if (isLoading) return <div className="p-4 text-muted-foreground animate-pulse">Loading vendors...</div>;

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

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-accent/50 text-muted-foreground">
            <tr>
              <th className="p-4 font-medium">Stall</th>
              <th className="p-4 font-medium">Cuisine</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Counter</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vendors.map((v) => {
              const vendorId = v.id || (v as any)._id;
              return (
              <tr key={vendorId} className="transition-colors hover:bg-accent/30">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-xl">
                      {v.emoji}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{v.name}</div>
                      <div className="text-xs text-muted-foreground">{vendorId}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">{v.cuisine}</td>
                <td className="p-4">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${v.isActive !== false ? "bg-mint-soft text-mint-ink" : "bg-destructive/20 text-destructive"}`}>
                    {v.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">{v.counter}</td>
                <td className="p-4 space-x-3">
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
                </td>
              </tr>
            )})}
            {vendors.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No vendors found. Add a new stall!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
