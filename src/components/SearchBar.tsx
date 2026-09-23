import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { productImage, vendorImage } from "@/lib/images";
import { quickSearches, suggest } from "@/lib/search";
import { useCatalog } from "@/lib/catalog-client";

export function SearchBar({
  initialQuery = "",
  autoFocus = false,
}: {
  initialQuery?: string;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const boxRef = useRef<HTMLDivElement>(null);
  const { vendors, products } = useCatalog();

  const results = useMemo(
    () => suggest(q, vendors, products),
    [q, vendors, products],
  );

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    navigate({ to: "/search", search: { q: q.trim() } });
  };

  return (
    <div ref={boxRef} className="relative">
      <form onSubmit={go} className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base">
            🔍
          </span>
          <input
            value={q}
            autoFocus={autoFocus}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search tea, snacks, biryani…"
            aria-label="Search food and vendors"
            className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground active:scale-95"
        >
          Go
        </button>
      </form>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]">
          {q.trim() === "" ? (
            <div className="p-3">
              <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Popular searches
              </p>
              <div className="flex flex-wrap gap-2">
                {quickSearches.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setQ(s);
                      navigate({ to: "/search", search: { q: s } });
                      setOpen(false);
                    }}
                    className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground active:scale-95"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No matches for “{q}”.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {results.map((r) => {
                const isProduct = r.kind === "product";
                const to = "/vendors/$vendorId";
                return (
                  <li key={isProduct ? r.product.id : `v-${r.vendor.id}`}>
                    <Link
                      to={to}
                      params={{ vendorId: r.vendor.id }}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-secondary"
                    >
                      <img
                        src={
                          isProduct
                            ? productImage(r.product.id)
                            : vendorImage(r.vendor.id)
                        }
                        alt=""
                        loading="lazy"
                        className="h-10 w-10 shrink-0 rounded-xl object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {isProduct ? r.product.name : r.vendor.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {isProduct
                            ? `${r.vendor.name} · ₹${r.product.price}`
                            : r.vendor.cuisine}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-primary">
                        {isProduct ? "View" : "Menu"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
