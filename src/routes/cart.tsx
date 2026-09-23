import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog-client";
import { productImage } from "@/lib/images";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — Easy Food" },
      {
        name: "description",
        content: "Review your food court items before checkout.",
      },
      { property: "og:title", content: "Your cart — Easy Food" },
      {
        property: "og:description",
        content: "Review your food court items before checkout.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { detailed, setQty, remove, total, clear } = useCart();
  const { vendorById } = useCatalog();

  if (detailed.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Add something tasty from a vendor counter.
        </p>
        <Link
          to="/vendors"
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          Browse vendors
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">Your cart</h1>

      <div className="mt-6 grid gap-3">
        {detailed.map(({ product, qty }) => (
          <div
            key={product.id}
            className="surface-card flex items-center gap-4 p-4"
          >
            <img
              src={productImage(product.id)}
              alt={product.name}
              loading="lazy"
              width={512}
              height={512}
              className="h-14 w-14 shrink-0 rounded-2xl object-cover"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                {vendorById(product.vendorId)?.name} · ₹{product.price}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-secondary p-1">
              <button
                aria-label="Decrease quantity"
                onClick={() => setQty(product.id, qty - 1)}
                className="grid h-8 w-8 place-items-center rounded-full bg-card font-bold"
              >
                −
              </button>
              <span className="w-5 text-center text-sm font-semibold">
                {qty}
              </span>
              <button
                aria-label="Increase quantity"
                onClick={() => setQty(product.id, qty + 1)}
                className="grid h-8 w-8 place-items-center rounded-full bg-card font-bold"
              >
                +
              </button>
            </div>
            <button
              onClick={() => remove(product.id)}
              className="text-sm font-medium text-muted-foreground hover:text-destructive"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="surface-card mt-6 p-5">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Item total</span>
          <span>₹{total}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm text-muted-foreground">
          <span>Counter charge</span>
          <span>₹0</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-bold">
          <span>To pay</span>
          <span>₹{total}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/checkout"
            className="flex-1 rounded-full bg-primary px-6 py-3 text-center font-semibold text-primary-foreground"
          >
            Checkout
          </Link>
          <button
            onClick={clear}
            className="rounded-full border border-border px-5 py-3 text-sm font-semibold"
          >
            Clear cart
          </button>
        </div>
      </div>
    </div>
  );
}
