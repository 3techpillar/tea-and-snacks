import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCatalog } from "@/lib/catalog-client";
import { useAuth } from "@/lib/auth-client";
import { ClipboardList, UtensilsCrossed, Settings } from "lucide-react";
import { LiveOrdersTab } from "@/components/vendor/LiveOrdersTab";
import { MenuManagementTab } from "@/components/vendor/MenuManagementTab";
import { VendorSettingsTab } from "@/components/vendor/VendorSettingsTab";

export const Route = createFileRoute("/vendor/$vendorId")({
  head: () => ({
    meta: [
      { title: "Stall orders — Easy Food vendor" },
      {
        name: "description",
        content: "Manage live orders, confirm UPI payments and update tokens.",
      },
      { property: "og:title", content: "Stall orders — Easy Food vendor" },
      {
        property: "og:description",
        content: "Manage live orders, confirm UPI payments and update tokens.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VendorDashboard,
});

function VendorDashboard() {
  const { vendorId } = Route.useParams();
  const { vendorById } = useCatalog();
  const vendor = vendorById(vendorId);
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "settings">("orders");

  const hasAccess =
    user?.role === "admin" ||
    (user?.role === "vendor" && user.vendorId === vendorId);

  if (!vendor) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Stall not found</h1>
        <Link
          to="/vendor"
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          All stalls
        </Link>
      </div>
    );
  }

  if (!authLoading && !hasAccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Sign in as this stall's vendor</h1>
        <p className="mt-2 text-muted-foreground">
          {user
            ? "Your account doesn't manage this stall."
            : "You need to sign in with this stall's vendor account."}
        </p>
        <Link
          to="/login"
          search={{ redirect: `/vendor/${vendorId}` }}
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full shrink-0 border-r border-border bg-card p-4 md:w-64">
        <div className="mb-8 hidden md:block">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl gradient-hero text-xl">
              {vendor.emoji}
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-display font-bold text-foreground">{vendor.name}</h2>
              <p className="text-xs text-muted-foreground">Vendor Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex space-x-2 overflow-x-auto md:flex-col md:space-x-0 md:space-y-2">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "orders" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Live Orders
          </button>
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "menu" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" />
            Menu Management
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "settings" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </nav>

        <div className="mt-8 hidden border-t border-border pt-4 md:block">
          <Link
            to="/vendor"
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            Switch Stall →
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          {activeTab === "orders" && (
            <LiveOrdersTab vendorId={vendorId} hasAccess={hasAccess} />
          )}

          {activeTab === "menu" && (
            <MenuManagementTab vendorId={vendorId} />
          )}

          {activeTab === "settings" && (
            <VendorSettingsTab vendorId={vendorId} vendor={vendor} />
          )}
        </div>
      </main>
    </div>
  );
}
