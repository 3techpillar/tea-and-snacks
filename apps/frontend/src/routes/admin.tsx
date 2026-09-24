import { Outlet, Link, createFileRoute, redirect } from "@tanstack/react-router";
import { LayoutDashboard, Store, ClipboardList } from "lucide-react";
import { useAuth } from "@/lib/auth-client";

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
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full border-r border-border bg-card p-4 md:w-64">
        <div className="mb-8 hidden md:block">
          <h2 className="text-lg font-bold text-foreground">Admin Portal</h2>
          <p className="text-xs text-muted-foreground">Easy Food Dashboard</p>
        </div>
        <nav className="flex space-x-2 overflow-x-auto md:flex-col md:space-x-0 md:space-y-2">
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
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-background p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
