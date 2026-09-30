import { Outlet, Link, createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, Store, ClipboardList, Home } from "lucide-react";
import { useAuth } from "@/lib/auth-client";
import { UserMenu } from "@/components/UserMenu";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ context }) => {
    // Need to safely check auth state if we inject it into context,
    // but typically auth is checked in the component or via context.auth.
    // For now, we rely on the component rendering logic to redirect if not admin.
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading admin...</div>;
  }

  if (!user || user.role !== "admin") {
    // If not admin, we could show an error or redirect.
    // In a real app, beforeLoad in the router handles this better.
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-semibold text-destructive">Access Denied</h2>
        <p className="mt-2 text-muted-foreground">You do not have permission to view this area.</p>
        <Link to="/" className="mt-4 text-primary underline">Return to Home</Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-4">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground">Admin Portal</h2>
          <p className="text-xs text-muted-foreground">Easy Food Dashboard</p>
        </div>
        <nav className="flex flex-col space-y-2">
          <Link
            to="/admin/orders"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
          >
            <ClipboardList className="h-4 w-4" />
            Live Orders
          </Link>
          <Link
            to="/admin/vendors"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
          >
            <Store className="h-4 w-4" />
            Manage Vendors
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            Manage Users
          </Link>
        </nav>

        <div className="mt-auto border-t border-border pt-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            Back Home
          </Link>
          <UserMenu />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-background p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-background/85 backdrop-blur-lg pb-safe-bottom">
        <Link
          to="/admin/orders"
          className="flex flex-col items-center justify-center p-3 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:text-primary"
        >
          <ClipboardList className="mb-1 h-5 w-5" />
          Orders
        </Link>
        <Link
          to="/admin/vendors"
          className="flex flex-col items-center justify-center p-3 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:text-primary"
        >
          <Store className="mb-1 h-5 w-5" />
          Vendors
        </Link>
        <Link
          to="/admin/users"
          className="flex flex-col items-center justify-center p-3 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:text-primary"
        >
          <LayoutDashboard className="mb-1 h-5 w-5" />
          Users
        </Link>
      </nav>
    </div>
  );
}
