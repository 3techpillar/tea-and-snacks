import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth-client";
import type { Product, ProductVariant } from "@tea-and-snacks/shared";
import { productImage } from "@/lib/images";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { add, lines, setQty } = useCart();
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);

  // For non-variant items, we just use the first line that matches.
  // For variant items, we might have multiple lines in the cart.
  const totalQty = lines
    .filter((l) => l.productId === product.id)
    .reduce((sum, l) => sum + l.qty, 0);

  // qty for the default (non-variant) case
  const defaultQty = lines.find((l) => l.productId === product.id && !l.variantId)?.qty ?? 0;

  const isOwnItem = user?.role === "vendor" && user.vendorId === product.vendorId;

  const quickOrder = () => {
    if (isOwnItem) return;
    
    if (product.hasVariants) {
      setShowOptions(true);
      return;
    }

    if (defaultQty === 0) add(product.id);
    navigate({ to: "/checkout" });
  };

  return (
    <>
      <div className="surface-card group flex items-center gap-4 p-3 transition-colors hover:border-primary/40 sm:p-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-24">
          <img
            src={product.imageUrl || productImage(product.id)}
            alt={product.name}
            loading="lazy"
            width={512}
            height={512}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`grid h-4 w-4 place-items-center rounded-sm border text-[8px] ${
                product.veg
                  ? "border-mint text-mint-ink"
                  : "border-chili text-chili-ink"
              }`}
            >
              ●
            </span>
            <h4 className="truncate font-semibold">{product.name}</h4>
          </div>
          {product.tag && (
            <span className="mt-1 inline-block rounded-full bg-mango-soft px-2 py-0.5 text-xs font-medium text-mango-ink">
              {product.tag}
            </span>
          )}
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {product.hasVariants ? "Starts at " : ""}₹{product.price}
          </p>
          
          {!isOwnItem && !product.hasVariants && (
            <button
              onClick={quickOrder}
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-mango-soft px-3 py-1 text-xs font-bold text-mango-ink transition-transform active:scale-95"
            >
              ⚡ Quick order
            </button>
          )}
        </div>

        {isOwnItem ? (
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Your item
          </span>
        ) : product.hasVariants ? (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={() => setShowOptions(true)}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-pop)] transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              Options
            </button>
            {totalQty > 0 && (
              <span className="text-[10px] font-bold text-primary mr-2">{totalQty} in cart</span>
            )}
          </div>
        ) : defaultQty === 0 ? (
          <button
            onClick={() => add(product.id)}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-pop)] transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            Add
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-full bg-secondary p-1">
            <button
              aria-label="Decrease quantity"
              onClick={() => setQty(product.id, defaultQty - 1)}
              className="grid h-8 w-8 place-items-center rounded-full bg-card font-bold active:scale-90"
            >
              −
            </button>
            <span className="w-5 text-center text-sm font-semibold">{defaultQty}</span>
            <button
              aria-label="Increase quantity"
              onClick={() => add(product.id)}
              className="grid h-8 w-8 place-items-center rounded-full bg-card font-bold active:scale-90"
            >
              +
            </button>
          </div>
        )}
      </div>

      {product.hasVariants && (
        <Dialog open={showOptions} onOpenChange={setShowOptions}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-6 bg-muted/20 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <img
                    src={product.imageUrl || productImage(product.id)}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <DialogTitle className="text-xl">{product.name}</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select {product.variantLabel?.toLowerCase() || "options"}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="p-2 overflow-y-auto max-h-[60vh]">
              {product.variants?.map((variant) => {
                const vQty = lines.find((l) => l.productId === product.id && l.variantId === variant.id)?.qty ?? 0;
                
                return (
                  <div key={variant.id} className="flex items-center justify-between p-4 hover:bg-muted/30 rounded-xl transition-colors">
                    <div className="flex flex-col">
                      <span className="font-semibold">{variant.name}</span>
                      <span className="text-sm text-muted-foreground font-medium">₹{variant.price}</span>
                    </div>

                    {vQty === 0 ? (
                      <button
                        onClick={() => add(product.id, variant.id)}
                        className="rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-5 py-1.5 text-sm font-semibold transition-all active:scale-95"
                      >
                        Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-full bg-secondary p-1">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => setQty(product.id, vQty - 1, variant.id)}
                          className="grid h-8 w-8 place-items-center rounded-full bg-card font-bold active:scale-90 shadow-sm text-foreground"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-semibold text-foreground">{vQty}</span>
                        <button
                          aria-label="Increase quantity"
                          onClick={() => add(product.id, variant.id)}
                          className="grid h-8 w-8 place-items-center rounded-full bg-card font-bold active:scale-90 shadow-sm text-foreground"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
