import { createFileRoute, Link, useNavigate, Outlet, useChildMatches } from "@tanstack/react-router";
import { useCatalog } from "@/lib/catalog-client";
import { useAuth } from "@/lib/auth-client";
import { ClipboardList, UtensilsCrossed, Settings, Home } from "lucide-react";
import { LiveOrdersTab } from "@/components/vendor/LiveOrdersTab";
import { MenuManagementTab } from "@/components/vendor/MenuManagementTab";
import { VendorSettingsTab } from "@/components/vendor/VendorSettingsTab";
import { UserMenu } from "@/components/UserMenu";

type VendorDashboardSearch = {
  tab?: "orders" | "menu" | "settings";
  status?: string;
  page?: number;
};

export const Route = createFileRoute("/vendor/$vendorId")({
  validateSearch: (search: Record<string, unknown>): VendorDashboardSearch => ({
    tab: (search.tab as "orders" | "menu" | "settings") || "orders",
    status: search.status as string | undefined,
    page: search.page ? Number(search.page) : 1,
  }),
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
  const { tab: activeTab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { vendorById } = useCatalog();
  const vendor = vendorById(vendorId);
  const { user, isLoading: authLoading } = useAuth();
  const childMatches = useChildMatches();
  const isChildRoute = childMatches.length > 0;

  const setActiveTab = (tab: "orders" | "menu" | "settings") => {
    navigate({ search: { tab } });
  };

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
    <div className="flex h-full flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card p-4">
        <div className="mb-8">
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

        <nav className="flex flex-col space-y-2">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              !activeTab || activeTab === "orders" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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

        <div className="mt-auto border-t border-border pt-4 flex flex-col gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            Back Home
          </Link>
          <div className="flex items-center justify-between">
            <Link
              to="/vendor"
              className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground hover:underline"
            >
              Switch Stall →
            </Link>
            <UserMenu />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8 pb-20 md:pb-8">
        <div className="mx-auto max-w-4xl">
          {isChildRoute ? (
            <Outlet />
          ) : (
            <>
              {(!activeTab || activeTab === "orders") && (
                <LiveOrdersTab vendorId={vendorId} hasAccess={hasAccess} />
              )}

              {activeTab === "menu" && (
                <MenuManagementTab vendorId={vendorId} />
              )}

              {activeTab === "settings" && (
                <VendorSettingsTab vendorId={vendorId} vendor={vendor} />
              )}
            </>
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-background/85 backdrop-blur-lg pb-safe-bottom">
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex flex-col items-center justify-center p-3 text-[10px] font-medium transition-colors ${
            !activeTab || activeTab === "orders" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardList className="mb-1 h-5 w-5" />
          Orders
        </button>
        <button
          onClick={() => setActiveTab("menu")}
          className={`flex flex-col items-center justify-center p-3 text-[10px] font-medium transition-colors ${
            activeTab === "menu" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UtensilsCrossed className="mb-1 h-5 w-5" />
          Menu
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center justify-center p-3 text-[10px] font-medium transition-colors ${
            activeTab === "settings" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="mb-1 h-5 w-5" />
          Settings
        </button>
      </nav>
    </div>
  );
}
