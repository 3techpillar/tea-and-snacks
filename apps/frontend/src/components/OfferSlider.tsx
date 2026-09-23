import { accentSoftClass } from "@/lib/data";
import { useCatalog } from "@/lib/catalog-client";

export function OfferSlider() {
  const { offers } = useCatalog();
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
      {offers.map((offer) => (
        <div
          key={offer.id}
          className={`min-w-[220px] snap-start rounded-2xl px-4 py-3 ${accentSoftClass[offer.accent]}`}
        >
          <p className="font-display text-lg font-semibold">{offer.title}</p>
          <p className="text-sm opacity-80">{offer.detail}</p>
          <span className="mt-2 inline-block rounded-full bg-card px-2 py-1 text-xs font-bold tracking-wide text-card-foreground">
            {offer.code}
          </span>
        </div>
      ))}
    </div>
  );
}
