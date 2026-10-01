import { createFileRoute, Link } from "@tanstack/react-router";
import { SearchBar } from "@/components/SearchBar";
import { OfferSlider } from "@/components/OfferSlider";
import { VendorCard } from "@/components/VendorCard";
import { useCatalog } from "@/lib/catalog-client";
import { heroImages, productImage } from "@/lib/images";
import { discountedPrice } from "@tea-and-snacks/shared";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Easy Food — Order from your food court" },
      {
        name: "description",
        content:
          "Browse food court vendors, build your cart and track your token number from pending to ready.",
      },
      {
        property: "og:title",
        content: "Easy Food — Order from your food court",
      },
      {
        property: "og:description",
        content:
          "Browse vendors, order tea, snacks and meals, and track your token live.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { vendors, products } = useCatalog();
  const topVendors = vendors.slice(0, 4);

  const heroSlides = [
    {
      img: heroImages[0],
      title: "Tea & Snacks",
      description: "Freshly brewed chai and crispy samosas for your perfect break.",
    },
    {
      img: heroImages[1],
      title: "Pure Veg Delights",
      description: "Wholesome and vibrant vegetarian meals, rich in flavor.",
    },
    {
      img: heroImages[2],
      title: "Non-Veg Feasts",
      description: "Authentic biryanis and curries packed with aromatic spices.",
    },
    {
      img: heroImages[3],
      title: "Fast Food Cravers",
      description: "Gourmet burgers and crispy fries to satisfy your cravings.",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:py-8">
      <section className="relative overflow-hidden rounded-3xl h-[420px] sm:h-[500px]">
        <div className="absolute inset-0 flex h-full w-full animate-hero-scroll">
          {[...heroSlides, heroSlides[0]].map((slide, idx) => (
            <div key={idx} className="relative h-full w-full shrink-0">
              <img
                src={slide.img}
                alt={slide.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 media-overlay" />
              <div className="absolute inset-0 gradient-hero opacity-40 mix-blend-multiply" />
              
              <div className="relative flex h-full flex-col justify-center px-5 py-10 text-on-media sm:px-12 sm:py-20">
                <p className="inline-flex self-start items-center gap-2 rounded-full bg-card/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-mint" />
                  Live · order now
                </p>
                <h1 className="mt-3 max-w-xl text-[2.1rem] font-bold leading-[1.05] drop-shadow sm:text-6xl">
                  {slide.title}
                </h1>
                <p className="mt-3 max-w-lg text-sm opacity-90 sm:text-base">
                  {slide.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
                  <Link
                    to="/vendors"
                    className="inline-flex flex-1 justify-center rounded-full bg-card px-5 py-3 text-sm font-semibold text-card-foreground transition-transform active:scale-95 sm:flex-none sm:px-6 sm:text-base"
                  >
                    Order now
                  </Link>
                  <Link
                    to="/orders"
                    className="inline-flex flex-1 justify-center rounded-full border border-on-media/40 px-5 py-3 text-sm font-semibold text-on-media backdrop-blur transition-colors hover:bg-card/15 sm:flex-none sm:px-6 sm:text-base"
                  >
                    Track token
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="relative z-30 mt-4">
        <SearchBar />
      </div>

      {/* <section className="mt-6 sm:mt-10">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold sm:text-2xl">
            Popular vendors
          </h2>
          <Link to="/vendors" className="text-sm font-semibold text-primary">
            See all →
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
          {topVendors.map((v, idx) => {
            const tones = [
              "bg-mango-soft text-mango-ink",
              "bg-chili-soft text-chili-ink",
              "bg-mint-soft text-mint-ink",
              "bg-grape-soft text-grape-ink"
            ];
            const emojis = ["🔥", "⭐", "🎉", "✨"];
            return (
              <Link
                key={v.id}
                to="/vendors/$vendorId"
                params={{ vendorId: v.id }}
                className={`flex min-w-[132px] snap-start items-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold transition-transform active:scale-95 ${tones[idx % tones.length]}`}
              >
                <span className="text-xl">{emojis[idx % emojis.length]}</span>
                <span className="truncate">{v.name}</span>
              </Link>
            );
          })}
        </div>
      </section> */}

      {/* <section className="mt-7 sm:mt-10">
        <h2 className="text-lg font-semibold sm:text-2xl">Running offers 🎉</h2>
        <div className="mt-3">
          <OfferSlider />
        </div>
      </section> */}

      {/* 🔥 Today's Deals — promoted products across all vendors */}
      {(() => {
        const deals = products.filter(
          (p) => p.discountPercent && p.discountPercent > 0 && (p.status === "available" || (!p.status && p.isAvailable !== false))
        );
        if (deals.length === 0) return null;
        return (
          <section className="mt-7 sm:mt-10">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold sm:text-2xl">🔥 Today's Deals</h2>
            </div>
            <div className="no-scrollbar -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
              {deals.map((p) => {
                const v = vendors.find((v) => v.id === p.vendorId);
                if (!v) return null;
                return (
                  <Link
                    key={p.id}
                    to="/vendors/$vendorId"
                    params={{ vendorId: p.vendorId }}
                    className="group relative flex min-w-[200px] max-w-[220px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="relative h-28 w-full overflow-hidden bg-muted">
                      <img
                        src={p.imageUrl || productImage(p.id)}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute left-2 top-2 rounded-full bg-chili px-2 py-0.5 text-[10px] font-bold text-chili-foreground shadow-md">
                        {p.discountPercent}% OFF
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <h3 className="line-clamp-1 text-sm font-semibold">
                        {p.emoji} {p.name}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {v.name}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-sm font-bold text-foreground">
                          ₹{discountedPrice(p.price, p.discountPercent)}
                        </span>
                        <span className="text-[11px] text-muted-foreground line-through">
                          ₹{p.price}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })()}

      <section className="mt-7 sm:mt-10">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold sm:text-2xl">All vendors</h2>
          <Link to="/vendors" className="text-sm font-semibold text-primary">
            See all →
          </Link>
        </div>
        <div className="mt-3 grid gap-4 sm:mt-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {vendors.map((v) => (
            <VendorCard key={v.id} vendor={v} />
          ))}
        </div>
      </section>
    </div>
  );
}
