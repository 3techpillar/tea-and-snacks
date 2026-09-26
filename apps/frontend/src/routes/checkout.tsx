import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { ordersApi } from "@/lib/api/orders";
import { useCatalog } from "@/lib/catalog-client";
import { useAuth } from "@/lib/auth-client";
import { UpiQr } from "@/components/UpiQr";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Easy Food" },
      {
        name: "description",
        content: "Enter your details and pay by UPI to place your order.",
      },
      { property: "og:title", content: "Checkout — Easy Food" },
      {
        property: "og:description",
        content: "Enter your details and pay by UPI to place your order.",
      },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { detailed, total, clear } = useCart();
  const { vendorById } = useCatalog();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const placeOrder = useMutation({
    mutationFn: (input: {
      customerName: string;
      customerPhone: string;
      items: { productId: string; variantId?: string; qty: number }[];
    }) => ordersApi.place(input),
    onSuccess: (order) => {
      clear();
      navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Could not place order."),
  });

  if (detailed.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Nothing to check out</h1>
        <Link
          to="/vendors"
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          Browse vendors
        </Link>
      </div>
    );
  }

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Sign in to check out</h1>
        <p className="mt-2 text-muted-foreground">
          Your order is tied to your account so you can track it from any
          device.
        </p>
        <Link
          to="/login"
          search={{ redirect: "/checkout" }}
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          Sign in
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">
          New here?{" "}
          <Link
            to="/register"
            search={{ redirect: "/checkout" }}
            className="font-semibold text-primary underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    );
  }

  const vendorTotals = detailed.reduce(
    (acc, { product, variant, qty }) => {
      const vendor = vendorById(product.vendorId);
      if (!vendor) return acc;
      const row = acc.find((a) => a.vendor.id === vendor.id);
      const price = variant ? variant.price : product.price;
      if (row) row.amount += price * qty;
      else acc.push({ vendor, amount: price * qty });
      return acc;
    },
    [] as {
      vendor: NonNullable<ReturnType<typeof vendorById>>;
      amount: number;
    }[],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user) return;
    if (phone.trim().length < 8) {
      setError("Please enter a valid phone number.");
      return;
    }
    placeOrder.mutate({
      customerName: user.name,
      customerPhone: phone.trim(),
      items: detailed.map(({ product, variant, qty }) => ({
        productId: product.id,
        variantId: variant?.id,
        qty,
      })),
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">Checkout</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <form onSubmit={submit} className="surface-card space-y-4 p-5">
          <div>
            <p className="text-sm font-semibold">Ordering as</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {user?.name} · {user?.email}
            </p>
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-semibold">
              Phone
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="rounded-2xl bg-sky-soft p-4 text-sky-ink">
            <p className="font-semibold">Scan &amp; pay ₹{total} by UPI</p>
            <p className="mt-1 text-sm opacity-85">
              Scan each stall's QR with any UPI app, then upload the payment
              screenshot on the next screen.
            </p>
          </div>

          <div className="grid gap-3">
            {vendorTotals.map(({ vendor, amount }) => (
              <UpiQr
                key={vendor.id}
                vendor={vendor}
                amount={amount}
                note={`Easy Food · ${vendor.name}`}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={placeOrder.isPending}
            className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-60"
          >
            {placeOrder.isPending
              ? "Placing order…"
              : `Place order · ₹${total}`}
          </button>
        </form>

        <aside className="surface-card h-fit p-5">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <div className="mt-3 space-y-2 text-sm">
            {detailed.map(({ product, qty }) => (
              <div key={product.id} className="flex justify-between">
                <span className="text-muted-foreground">
                  {qty} × {product.emoji} {product.name}
                </span>
                <span className="font-semibold">₹{product.price * qty}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-3 font-bold">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
