import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth-client";
import type { Product } from "@tea-and-snacks/shared";
import { discountedPrice } from "@tea-and-snacks/shared";
import { productImage } from "@/lib/images";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function VendorMenuCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { add, lines, setQty } = useCart();
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);

  const totalQty = lines
    .filter((l) => l.productId === product.id)
    .reduce((sum, l) => sum + l.qty, 0);

  const defaultQty = lines.find((l) => l.productId === product.id && !l.variantId)?.qty ?? 0;

  const isOwnItem = user?.role === "vendor" && user.vendorId === product.vendorId;
  const isAvailableStatus = product.status === "available" || (!product.status && product.isAvailable !== false);
  const isOrderable = isAvailableStatus;
  const statusText = product.status === "coming_soon" ? "Coming Soon" : product.status === "out_of_stock" ? "Out of Stock" : "Unavailable";

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
      <div className="surface-card group flex flex-col overflow-hidden transition-all hover:border-primary/40 hover:shadow-md">
        <div className="relative w-full shrink-0 overflow-hidden bg-muted aspect-[4/3] sm:aspect-video">
          <img
            src={product.imageUrl || productImage(product.id)}
            alt={product.name}
            loading="lazy"
            width={512}
            height={512}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.discountPercent ? (
            <div className="absolute left-2 top-2 rounded-full bg-chili px-2 py-0.5 text-[10px] font-bold text-chili-foreground shadow-md animate-pulse">
              {product.discountPercent}% OFF
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-2.5 sm:p-3">
          <div className="flex items-start gap-1.5 sm:gap-2">
            <span
              className={`mt-1 grid h-3 w-3 sm:h-4 sm:w-4 shrink-0 place-items-center rounded-[2px] sm:rounded-sm border text-[6px] sm:text-[8px] ${
                product.veg
                  ? "border-mint text-mint-ink"
                  : "border-chili text-chili-ink"
              }`}
            >
              ●
            </span>
            <h4 className="line-clamp-2 font-semibold text-sm leading-tight sm:text-[15px] sm:leading-snug">{product.name}</h4>
          </div>
          
          <div className="mt-0.5 sm:mt-1 flex items-center gap-1.5 flex-wrap">
            {product.discountPercent ? (
              <>
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  ₹{discountedPrice(product.price, product.discountPercent)}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                  ₹{product.price}
                </span>
                <span className="rounded-full bg-chili-soft px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-chili-ink">
                  {product.discountPercent}% OFF
                </span>
              </>
            ) : (
              <span className="text-xs sm:text-sm font-bold text-foreground">
                {product.hasVariants ? "Starts at " : ""}₹{product.price}
              </span>
            )}
          </div>

          <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1 sm:gap-1.5">
            {product.tag && (
              <span className="inline-block rounded-full bg-mango-soft px-1.5 py-0.5 sm:px-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-mango-ink">
                {product.tag}
              </span>
            )}
            {product.status === "available" || (!product.status && product.isAvailable !== false) ? (
              <span className="inline-block rounded-full bg-mint-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-mint-ink">
                Available
              </span>
            ) : product.status === "coming_soon" ? (
              <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                Coming Soon
              </span>
            ) : product.status === "out_of_stock" ? (
              <span className="inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
                Out of Stock
              </span>
            ) : (
              <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Unavailable
              </span>
            )}
            
            {product.isQuickDelivery ? (
              <span className="inline-block rounded-full bg-amber-100 px-1.5 py-0.5 sm:px-2 text-[10px] sm:text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                ⚡ Quick
              </span>
            ) : product.prepTime ? (
              <span className="inline-block rounded-full bg-secondary px-1.5 py-0.5 sm:px-2 text-[10px] sm:text-xs font-medium text-muted-foreground">
                🕒 {product.prepTime}m
              </span>
            ) : null}
          </div>
          
          <div className="mt-auto pt-3 sm:pt-4">
            {isOwnItem ? (
              <div className="flex w-full justify-center rounded-full bg-secondary px-3 py-1.5 sm:py-2 text-xs font-semibold text-muted-foreground">
                Your item
              </div>
            ) : !isOrderable ? (
              <div className="flex w-full justify-center rounded-full bg-secondary px-3 py-1.5 sm:py-2 text-xs font-semibold text-muted-foreground">
                {statusText}
              </div>
            ) : product.hasVariants ? (
              <div className="flex w-full flex-col gap-1">
                <button
                  onClick={() => setShowOptions(true)}
                  className="w-full rounded-full bg-primary px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-[var(--shadow-pop)] transition-transform hover:scale-105 active:scale-95"
                >
                  Options
                </button>
                {totalQty > 0 && (
                  <span className="text-center text-[10px] font-bold text-primary">{totalQty} in cart</span>
                )}
              </div>
            ) : defaultQty === 0 ? (
              <button
                onClick={() => add(product.id)}
                className="w-full rounded-full bg-primary px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-[var(--shadow-pop)] transition-transform hover:scale-105 active:scale-95"
              >
                Add
              </button>
            ) : (
              <div className="flex w-full justify-between items-center rounded-full bg-secondary p-1">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQty(product.id, defaultQty - 1)}
                  className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full bg-card font-bold shadow-sm active:scale-90"
                >
                  −
                </button>
                <span className="text-center text-xs sm:text-sm font-semibold">{defaultQty}</span>
                <button
                  aria-label="Increase quantity"
                  onClick={() => add(product.id)}
                  className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full bg-card font-bold shadow-sm active:scale-90"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
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
