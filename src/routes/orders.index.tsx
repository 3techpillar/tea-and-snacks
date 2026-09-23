import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getOrdersFn } from "@/lib/api/orders";
import { statusToneClass } from "@/lib/orders";
import { useAuth } from "@/lib/auth-client";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "My orders — Easy Food" },
      {
        name: "description",
        content: "Track the food court orders you placed on this device.",
      },
      { property: "og:title", content: "My orders — Easy Food" },
      {
        property: "og:description",
        content: "Track the food court orders you placed on this device.",
      },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const ordersQuery = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: () => getOrdersFn(),
    enabled: !!user,
  });

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Sign in to see your orders</h1>
        <Link
          to="/login"
          search={{ redirect: "/orders" }}
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const orders = ordersQuery.data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">My orders</h1>

      {ordersQuery.isLoading ? (
        <p className="mt-4 text-muted-foreground">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          No orders yet on this account.
        </p>
      ) : (
        <div className="mt-6 grid gap-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              to="/orders/$orderId"
              params={{ orderId: o.id }}
              className="surface-card flex items-center justify-between gap-4 p-4 transition-transform hover:-translate-y-0.5"
            >
              <div>
                <p className="font-semibold">
                  #{o.id} · Token {o.token}
                </p>
                <p className="text-sm text-muted-foreground">
                  {o.items.reduce((s, i) => s + i.qty, 0)} items · ₹{o.total}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusToneClass[o.status]}`}
              >
                {o.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
