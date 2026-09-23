import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";

const tabs = [
  { to: "/", label: "Home", icon: "🏠", exact: true },
  { to: "/search", label: "Search", icon: "🔍", exact: false },
  { to: "/vendors", label: "Vendors", icon: "🏪", exact: false },
  { to: "/orders", label: "Orders", icon: "🧾", exact: false },
] as const;

export function BottomNav() {
  const { count } = useCart();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg sm:hidden">
      <div className="grid grid-cols-5">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: t.exact }}
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors active:scale-95"
            activeProps={{ className: "text-primary" }}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </Link>
        ))}
        <Link
          to="/cart"
          className="relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors active:scale-95"
          activeProps={{ className: "text-primary" }}
        >
          <span className="text-lg leading-none">🛒</span>
          Cart
          {count > 0 && (
            <span className="absolute right-[22%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}
