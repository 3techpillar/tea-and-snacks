import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-client";
import { useCatalog } from "@/lib/catalog-client";

export const Route = createFileRoute("/vendor/")({
  head: () => ({
    meta: [
      { title: "Vendor dashboard — Easy Food" },
      {
        name: "description",
        content:
          "Sign in to manage live orders, payments and tokens for your stall.",
      },
      { property: "og:title", content: "Vendor dashboard — Easy Food" },
      {
        property: "og:description",
        content:
          "Sign in to manage live orders, payments and tokens for your stall.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VendorEntry,
});

function VendorEntry() {
  const { user, isLoading } = useAuth();
  const { vendorById } = useCatalog();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (user?.role === "vendor" && user.vendorId) {
    const vendor = vendorById(user.vendorId);
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Vendor side
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold">
          {vendor ? `${vendor.emoji} ${vendor.name}` : "Your stall"}
        </h1>
        <Link
          to="/vendor/$vendorId"
          params={{ vendorId: user.vendorId }}
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          Open dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        Vendor side
      </p>
      <h1 className="mt-1 font-display text-3xl font-bold">
        Sign in to your stall
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {user
          ? "This account isn't set up as a vendor. Sign in with a vendor account to manage a stall."
          : "Each stall has its own vendor login — sign in to see incoming orders, verify UPI screenshots and move tokens along."}
      </p>
      <Link
        to="/login"
        search={{ redirect: "/vendor" }}
        className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
      >
        Sign in
      </Link>
      <p className="mt-4 text-xs text-muted-foreground">
        Demo logins seeded by <code>bun run seed</code>: e.g.{" "}
        <code>tea-point@vendors.easyfood.demo</code> / <code>vendor123</code>.
      </p>
    </div>
  );
}
