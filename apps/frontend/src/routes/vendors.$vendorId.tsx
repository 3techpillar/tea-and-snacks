import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import { accentClass, accentSoftClass, vendorById } from "@/lib/data";
import { catalogQueryOptions, useCatalog } from "@/lib/catalog-client";
import { vendorImage } from "@/lib/images";

export const Route = createFileRoute("/vendors/$vendorId")({
  loader: async ({ params, context }) => {
    const catalog =
      await context.queryClient.ensureQueryData(catalogQueryOptions);
    const vendor = vendorById(catalog.vendors, params.vendorId);
    if (!vendor) throw notFound();
    return { vendor };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Vendor not found — Easy Food" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.vendor.name} menu — Easy Food`;
    const description = `${loaderData.vendor.cuisine} from ${loaderData.vendor.name}. Ready in ${loaderData.vendor.eta}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: VendorMenu,
});

function VendorMenu() {
  const { vendorId } = Route.useParams();
  const {
    vendorById: findVendor,
    productsByVendor: findProducts,
    isLoading,
  } = useCatalog();
  const vendor = findVendor(vendorId);
  const items = findProducts(vendorId);

  const { count, total } = useCart();
  const [shared, setShared] = useState("");

  if (!vendor) {
    // The route loader already prefetches the catalog and 404s server-side
    // if the vendor doesn't exist; this only covers the brief client-side
    // window (e.g. a hard reload) before that cached data has hydrated.
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">
        {isLoading ? "Loading…" : "Stall not found."}
      </div>
    );
  }

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${vendor.name} — ${vendor.specialty} at ${vendor.counter}. Order on Easy Food:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: vendor.name, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShared("Link copied!");
      window.setTimeout(() => setShared(""), 2000);
    } catch {
      /* dismissed */
    }
  };

  const popular = items.filter((i) => i.tag).slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-40 sm:py-8">
      <Link
        to="/vendors"
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← All vendors
      </Link>

      <header className="relative mt-4 overflow-hidden rounded-3xl">
        <img
          src={vendorImage(vendor.id)}
          alt={`${vendor.name} — ${vendor.cuisine}`}
          width={800}
          height={600}
          className="h-48 w-full object-cover sm:h-60"
        />
        <div className="absolute inset-0 media-overlay" />
        <div
          className={`absolute inset-0 opacity-25 mix-blend-multiply ${accentClass[vendor.accent]}`}
        />
        <div className="absolute inset-x-6 bottom-5 text-on-media">
          <h1 className="text-3xl font-bold drop-shadow">{vendor.name}</h1>
          <p className="text-sm opacity-90">
            {vendor.cuisine} · ⭐ {vendor.rating} · ⏱ {vendor.eta}
          </p>
          <p className="mt-1 text-sm font-medium opacity-90">
            “{vendor.tagline}”
          </p>
        </div>
        <button
          onClick={share}
          aria-label={`Share ${vendor.name}`}
          className="absolute right-4 top-4 rounded-full bg-card/90 px-4 py-2 text-sm font-bold shadow-[var(--shadow-pop)] backdrop-blur transition-transform active:scale-95"
        >
          ↗ Share
        </button>
        {shared && (
          <span className="absolute right-4 top-16 rounded-full bg-mint-soft px-3 py-1 text-xs font-bold text-mint-ink">
            {shared}
          </span>
        )}
      </header>

      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className={`rounded-3xl p-4 ${accentSoftClass[vendor.accent]}`}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
            Stall specialty
          </p>
          <p className="mt-1 text-lg font-bold">
            {vendor.emoji} {vendor.specialty}
          </p>
          <p className="mt-2 text-sm opacity-85">
            {vendor.counter} · Open {vendor.hours}
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Why people come here
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {vendor.highlights.map((h) => (
              <li
                key={h}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold"
              >
                {h}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {popular.length > 0 && (
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
          {popular.map((p) => (
            <span
              key={p.id}
              className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
            >
              {p.emoji} {p.name} · {p.tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>

      {count > 0 && (
        <div className="safe-bottom fixed inset-x-0 bottom-14 z-40 sm:bottom-0 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <p className="text-sm font-semibold">
              {count} item{count > 1 ? "s" : ""} · ₹{total}
            </p>
            <Link
              to="/cart"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              View cart
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
