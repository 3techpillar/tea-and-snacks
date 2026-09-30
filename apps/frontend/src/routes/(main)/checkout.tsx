import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart";
import { ordersApi } from "@/lib/api/orders";
import { useCatalog } from "@/lib/catalog-client";
import { useAuth } from "@/lib/auth-client";
import { BUILDINGS } from "@tea-and-snacks/shared";
import type { BuildingId } from "@tea-and-snacks/shared";
import { DeliveryAddressForm } from "@/components/checkout/DeliveryAddressForm";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { OrderSummary } from "@/components/checkout/OrderSummary";

export const Route = createFileRoute("/(main)/checkout")({
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

  // Delivery address state
  const [building, setBuilding] = useState<BuildingId>(BUILDINGS[0].id);
  const [floor, setFloor] = useState("");
  const [officeNumber, setOfficeNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"online" | "offline">("online");
  const [error, setError] = useState("");

  // Prefill address and user details from profile
  useEffect(() => {
    if (user) {
      setRecipientName((prev) => prev || user.name);
      setPhone((prev) => prev || user.phone || "");
      
      if (user.defaultAddress) {
        setBuilding((prev) => (prev === BUILDINGS[0].id ? user.defaultAddress!.building as BuildingId : prev));
        setFloor((prev) => prev || user.defaultAddress!.floor);
        setOfficeNumber((prev) => prev || user.defaultAddress!.officeNumber);
      }
    }
  }, [user]);

  const placeOrder = useMutation({
    mutationFn: (input: Parameters<typeof ordersApi.place>[0]) =>
      ordersApi.place(input),
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
    if (!floor.trim()) {
      setError("Please enter a floor number.");
      return;
    }
    if (!officeNumber.trim()) {
      setError("Please enter an office number.");
      return;
    }
    if (phone.trim().length < 8) {
      setError("Please enter a valid phone number.");
      return;
    }
    placeOrder.mutate({
      customerName: recipientName.trim() || user.name,
      customerPhone: phone.trim(),
      paymentMethod,
      deliveryAddress: {
        building,
        floor: floor.trim(),
        officeNumber: officeNumber.trim(),
        recipientName: recipientName.trim() || user.name,
        recipientPhone: phone.trim(),
      },
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
          <DeliveryAddressForm
            building={building}
            setBuilding={setBuilding}
            floor={floor}
            setFloor={setFloor}
            officeNumber={officeNumber}
            setOfficeNumber={setOfficeNumber}
            recipientName={recipientName}
            setRecipientName={setRecipientName}
            phone={phone}
            setPhone={setPhone}
          />

          <PaymentMethodSelector
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            total={total}
            vendorTotals={vendorTotals}
          />

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

        <OrderSummary detailed={detailed} total={total} />
      </div>
    </div>
  );
}
