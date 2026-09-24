import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-client";
import { ProfileInfo } from "@/components/ProfileInfo";
import { RecentOrders } from "@/components/RecentOrders";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { Shield, LayoutDashboard, Store } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "Account Settings — Easy Food" }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Sign in to view your profile</h1>
      </div>
    );
  }

  return (
    <div className="bg-muted/10 min-h-[calc(100vh-64px)] pb-16">
      <div className="border-b border-border bg-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-medium tracking-tight text-foreground">
                Account Settings
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your account settings, security, and preferences.
              </p>
            </div>

            {/* Dashboard quick-access button for admin / vendor */}
            {user.role === "admin" && (
              <Link
                to="/admin/orders"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <LayoutDashboard className="h-4 w-4" />
                Admin Dashboard
              </Link>
            )}
            {user.role === "vendor" && user.vendorId && (
              <Link
                to="/vendor/$vendorId"
                params={{ vendorId: user.vendorId }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Store className="h-4 w-4" />
                Vendor Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left Column: Profile Info & Security */}
          <div className="space-y-8 flex flex-col">
            <ProfileInfo />

            {/* Security Section */}
            <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
                <div>
                  <h3 className="text-base font-medium">Security</h3>
                  <p className="text-sm text-muted-foreground">Keep your account secure</p>
                </div>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Account Password</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Change your password regularly to prevent unauthorized access.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 ml-4">
                  <ChangePasswordModal />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Orders */}
          <div className="h-full">
            <RecentOrders />
          </div>
        </div>
      </div>
    </div>
  );
}
