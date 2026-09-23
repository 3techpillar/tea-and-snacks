import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth-client";

export function Header() {
  const { count } = useCart();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-lg">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 sm:flex sm:py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl gradient-hero text-base shadow-[var(--shadow-pop)] sm:h-10 sm:w-10 sm:text-lg">
            🍽️
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-lg font-semibold leading-none sm:text-xl">
              Easy Food
            </span>
            <span className="mt-0.5 hidden text-[11px] font-medium text-muted-foreground sm:block">
              Campus food court
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 sm:flex">
          <Link
            to="/search"
            search={{ q: "" }}
            className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "bg-secondary text-foreground" }}
          >
            Search
          </Link>
          <Link
            to="/vendors"
            className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "bg-secondary text-foreground" }}
          >
            Vendors
          </Link>
          <Link
            to="/orders"
            className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "bg-secondary text-foreground" }}
          >
            My orders
          </Link>
          <Link
            to="/vendor"
            className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "bg-secondary text-foreground" }}
          >
            Vendor
          </Link>
          {user ? (
            <button
              onClick={() => logout()}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Sign out ({user.name.split(" ")[0]})
            </button>
          ) : (
            <Link
              to="/login"
              search={{ redirect: "/" }}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              Sign in
            </Link>
          )}
        </nav>

        <Link
          to="/cart"
          aria-label={`Cart, ${count} items`}
          className="relative inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-pop)] transition-transform active:scale-95 sm:px-4 hover:sm:scale-105"
        >
          🛒<span className="hidden sm:inline">Cart</span>
          {count > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary-foreground/25 px-1 text-xs">
              {count}
            </span>
          )}
        </Link>
      </div>
      <div className="h-1 gradient-rainbow" />
    </header>
  );
}
