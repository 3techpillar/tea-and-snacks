import { useNavigate } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth-client";
import type { Product } from "@/lib/data";
import { productImage } from "@/lib/images";

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { add, lines, setQty } = useCart();
  const navigate = useNavigate();
  const qty = lines.find((l) => l.productId === product.id)?.qty ?? 0;

  const isOwnItem = user?.role === "vendor" && user.vendorId === product.vendorId;

  const quickOrder = () => {
    if (isOwnItem) return;
    if (qty === 0) add(product.id);
    navigate({ to: "/checkout" });
  };

  return (
    <div className="surface-card group flex items-center gap-4 p-3 transition-colors hover:border-primary/40 sm:p-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-24">
        <img
          src={productImage(product.id)}
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
              product.veg ? "border-mint text-mint-ink" : "border-chili text-chili-ink"
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
        <p className="mt-1 text-sm font-semibold text-muted-foreground">₹{product.price}</p>
        {!isOwnItem && (
          <button
            onClick={quickOrder}
            className="mt-2 inline-flex items-center gap-1 rounded-full bg-mango-soft px-3 py-1 text-xs font-bold text-mango-ink transition-transform active:scale-95"
          >
            ⚡ Quick order
          </button>
        )}
      </div>

      {isOwnItem ? (
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
          Your item
        </span>
      ) : qty === 0 ? (
        <button
          onClick={() => add(product.id)}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-pop)] transition-transform hover:scale-105 active:scale-95"
        >
          Add
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-full bg-secondary p-1">
          <button
            aria-label="Decrease quantity"
            onClick={() => setQty(product.id, qty - 1)}
            className="grid h-8 w-8 place-items-center rounded-full bg-card font-bold active:scale-90"
          >
            −
          </button>
          <span className="w-5 text-center text-sm font-semibold">{qty}</span>
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
  );
}
