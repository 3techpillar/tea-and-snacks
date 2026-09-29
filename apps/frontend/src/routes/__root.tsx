import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth-client";
import { catalogQueryOptions } from "@/lib/catalog-client";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: any; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back
          home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(catalogQueryOptions),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

import { useNotifications } from "@/hooks/useNotifications";
import { resolveNotificationUrl } from "@/lib/notification-store";
import { useAuth } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";

function NotificationInitializer() {
  useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the app was opened by clicking a background notification
    const params = new URLSearchParams(window.location.search);
    const notificationType = params.get("notificationType");
    const orderId = params.get("orderId");

    if (notificationType || orderId) {
      const targetUrl = resolveNotificationUrl(
        { type: notificationType || undefined, orderId: orderId || undefined },
        user?.role,
        user?.vendorId
      );

      if (targetUrl) {
        // Clear the query params and navigate to the correct page
        navigate({ to: targetUrl, replace: true });
      }
    }
  }, [user, navigate]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { location } = useRouterState();
  const isAuthRoute = ["/login", "/register", "/forgot-password"].includes(location.pathname);
  const isDashboardRoute = location.pathname.startsWith("/admin") || location.pathname.startsWith("/vendor");

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationInitializer />
        <CartProvider>
          {isAuthRoute || isDashboardRoute ? (
            <div className="flex h-screen flex-col overflow-hidden bg-background">
              {(isAuthRoute || isDashboardRoute) && (
                <div className="md:hidden">
                  <Header />
                </div>
              )}
              <main className="relative flex-1 overflow-y-auto">
                <Outlet />
              </main>
            </div>
          ) : (
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 pb-16 sm:pb-0">
                <Outlet />
              </main>
              <Footer />
              <BottomNav />
            </div>
          )}
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
