import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import { vendorApi } from "@/lib/api/vendor";
import { useCatalog } from "@/lib/catalog-client";
import { DISCOUNT_STEPS, discountedPrice } from "@tea-and-snacks/shared";
import type { Product } from "@tea-and-snacks/shared";
import { InlinePrice } from "./MenuManagement/InlinePrice";

export function MenuManagementTab({ vendorId }: { vendorId: string }) {
  const { products } = useCatalog();
  const queryClient = useQueryClient();

  const vendorProducts = products.filter((p) => p.vendorId === vendorId);

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => vendorApi.deleteProduct(vendorId, productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ productId, status }: { productId: string; status: Product["status"] }) =>
      vendorApi.updateProduct(vendorId, productId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog"] }),
  });

  const priceMutation = useMutation({
    mutationFn: ({ productId, price }: { productId: string; price: number }) =>
      vendorApi.updateProduct(vendorId, productId, { price }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog"] }),
  });

  const promoMutation = useMutation({
    mutationFn: ({ productId, discountPercent }: { productId: string; discountPercent: number | null }) =>
      vendorApi.updateProduct(vendorId, productId, { discountPercent }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog"] }),
  });

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Manage Menu</h2>
          <p className="text-sm text-muted-foreground">
            {vendorProducts.length} item{vendorProducts.length !== 1 ? "s" : ""} in your menu
          </p>
        </div>
        <Link
          to={`/vendor/${vendorId}/products/new`}
          search={{ tab: "menu" }}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Item
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {vendorProducts.map((p) => {
          const productId = p.id || ((p as Record<string, unknown>)._id as string);
          return (
            <div
              key={productId}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Image header */}
              {p.imageUrl && (
                <div className="relative h-32 w-full overflow-hidden bg-accent">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 text-2xl">{p.emoji}</span>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-foreground">{p.name}</h3>
                      <div className="mt-0.5 flex items-center gap-2">
                        {p.hasVariants ? (
                          <span className="font-semibold text-sm text-foreground">Starts at ₹{p.price}</span>
                        ) : (
                          <InlinePrice
                            price={p.price}
                            onSave={(newPrice) =>
                              priceMutation.mutate({ productId, price: newPrice })
                            }
                            isSaving={priceMutation.isPending}
                          />
                        )}
                        {p.veg !== undefined && (
                          <span
                            className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border text-[9px] font-bold ${p.veg ? "border-green-600 text-green-600" : "border-red-600 text-red-600"}`}
                          >
                            {p.veg ? "●" : "●"}
                          </span>
                        )}
                      </div>
                      
                      {p.hasVariants && p.variants && p.variants.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {p.variants.map(v => (
                            <span key={v.id} className="inline-flex rounded-md bg-accent/50 px-2 py-0.5 text-[10px] font-medium text-accent-foreground border border-border">
                              {v.name} (₹{v.price})
                            </span>
                          ))}
                        </div>
                      )}

                      {p.tag && (
                        <span className="mt-1.5 inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium">
                          {p.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <select
                      value={p.status || (p.isAvailable !== false ? "available" : "unavailable")}
                      onChange={(e) =>
                        toggleMutation.mutate({ productId, status: e.target.value as Product["status"] })
                      }
                      disabled={toggleMutation.isPending}
                      className={`rounded-md border border-border px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary ${
                        p.status === "available" || p.isAvailable !== false ? "bg-mint-soft text-mint-ink" :
                        "bg-destructive/10 text-destructive"
                      }`}
                    >
                      <option value="available">Available</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="unavailable">Unavailable</option>
                      <option value="coming_soon">Coming Soon</option>
                    </select>
                  </div>
                </div>

                {/* Promotion control */}
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground">🏷️ Promo:</span>
                  <select
                    value={p.discountPercent ?? 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      promoMutation.mutate({ productId, discountPercent: val === 0 ? null : val });
                    }}
                    disabled={promoMutation.isPending}
                    className={`rounded-md border border-border px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary bg-card ${
                      p.discountPercent ? "text-chili-ink" : "text-muted-foreground"
                    }`}
                  >
                    <option value={0}>None</option>
                    {DISCOUNT_STEPS.map((s) => (
                      <option key={s} value={s}>{s}% off</option>
                    ))}
                  </select>
                  {p.discountPercent ? (
                    <span className="text-xs font-bold text-mint-ink">
                      ₹{p.price} → ₹{discountedPrice(p.price, p.discountPercent)}
                    </span>
                  ) : null}
                </div>

                {/* Actions row */}
                <div className="mt-4 flex items-center justify-end border-t border-border pt-3">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/vendor/${vendorId}/products/${productId}/edit`}
                      search={{ tab: "menu" }}
                      className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${p.name} from your menu?`)) {
                          deleteMutation.mutate(productId);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-xs font-medium text-destructive transition-colors hover:text-destructive/80 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {vendorProducts.length === 0 && (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-border py-16 text-center">
            <span className="text-4xl">🍽️</span>
            <p className="mt-3 font-semibold text-foreground">Your menu is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first item to start receiving orders.
            </p>
            <Link
              to={`/vendor/${vendorId}/products/new`}
              search={{ tab: "menu" }}
              className="mt-4 inline-flex items-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="mr-1 inline h-4 w-4" /> Add First Item
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
