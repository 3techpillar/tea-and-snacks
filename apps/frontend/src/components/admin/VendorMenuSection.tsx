import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useCatalog } from "@/lib/catalog-client";
import { UtensilsCrossed, Tag } from "lucide-react";
import { discountedPrice } from "@tea-and-snacks/shared";
import type { Product } from "@tea-and-snacks/shared";
import { DataTable, type ColumnDef } from "@/components/DataTable";

export function VendorMenuSection({ vendorId }: { vendorId: string }) {
  const { products, vendorById } = useCatalog();
  const [showMenu, setShowMenu] = useState(false);

  const vendorProducts = products.filter((p) => p.vendorId === vendorId);
  const vendor = vendorById(vendorId);

  const statusLabel: Record<string, { text: string; cls: string }> = {
    available: { text: "Available", cls: "bg-mint/10 text-mint-ink border-mint/20" },
    out_of_stock: { text: "Out of Stock", cls: "bg-destructive/10 text-destructive border-destructive/20" },
    unavailable: { text: "Unavailable", cls: "bg-secondary text-muted-foreground border-border" },
    coming_soon: { text: "Coming Soon", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  };

  const columns: ColumnDef<Product>[] = [
    {
      header: "Product",
      cell: (p) => (
        <div className="flex items-center gap-3">
          {p.imageUrl ? (
            <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-lg object-cover border border-border" />
          ) : (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-lg">
              {p.emoji}
            </span>
          )}
          <div>
            <p className="font-semibold text-foreground">{p.name}</p>
            {p.tag && (
              <span className="mt-0.5 inline-block rounded-full bg-mango-soft px-2 py-0.5 text-[10px] font-bold uppercase text-mango-ink">
                {p.tag}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      cell: (p) => {
        const hasDiscount = p.discountPercent && p.discountPercent > 0;
        return hasDiscount ? (
          <div className="flex flex-col">
            <span className="font-bold text-foreground">₹{discountedPrice(p.price, p.discountPercent)}</span>
            <span className="text-xs text-muted-foreground line-through">₹{p.price}</span>
          </div>
        ) : (
          <span className="font-bold text-foreground">₹{p.price}</span>
        );
      },
    },
    {
      header: "Promotion",
      cell: (p) => {
        const hasDiscount = p.discountPercent && p.discountPercent > 0;
        return hasDiscount ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-chili-soft px-2.5 py-1 text-xs font-bold text-chili-ink">
            <Tag className="h-3 w-3" />
            {p.discountPercent}% OFF
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      header: "Status",
      cell: (p) => {
        const st = statusLabel[p.status ?? "available"] ?? statusLabel.available;
        return (
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${st.cls}`}>
            {st.text}
          </span>
        );
      },
    },
    {
      header: "Type",
      cell: (p) => (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
          p.veg
            ? "border-green-600/30 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            : "border-red-600/30 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
        }`}>
          <span className="text-[8px]">●</span>
          {p.veg ? "Veg" : "Non-Veg"}
        </span>
      ),
    },
    {
      header: "Variants",
      cell: (p) => {
        return p.hasVariants && p.variants && p.variants.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {p.variants.map((v) => (
              <span key={v.id} className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground border border-border">
                {v.name} · ₹{v.price}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
  ];

  return (
    <div className="mt-8">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
      >
        <UtensilsCrossed className="h-4 w-4" />
        {showMenu ? "Hide Menu" : "View Menu"}
        {!showMenu && (
          <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs font-bold">
            {vendorProducts.length}
          </span>
        )}
      </button>

      {showMenu && (
        <div className="mt-4 surface-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          <div className="border-b border-border bg-muted/30 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                {vendor?.emoji} {vendor?.name ?? vendorId} — Menu Items
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {vendorProducts.length} product{vendorProducts.length !== 1 ? "s" : ""} listed
              </p>
            </div>
            <Link
              to="/vendors/$vendorId"
              params={{ vendorId }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View public page →
            </Link>
          </div>

          <div className="p-4 sm:p-6 bg-card">
            <DataTable
              columns={columns}
              data={vendorProducts}
              emptyMessage="No products listed for this vendor"
            />
          </div>
        </div>
      )}
    </div>
  );
}
