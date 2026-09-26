import { Link } from "@tanstack/react-router";
import { accentSoftClass, type Vendor } from "@/lib/data";
import { useCatalog } from "@/lib/catalog-client";
import { vendorImage } from "@/lib/images";

export function VendorCard({ vendor }: { vendor: Vendor }) {
  const { productsByVendor } = useCatalog();
  const menu = productsByVendor(vendor.id).slice(0, 3);

  return (
    <Link
      to="/vendors/$vendorId"
      params={{ vendorId: vendor.id }}
      className="surface-card group flex flex-col overflow-hidden transition-all duration-300 active:scale-[0.98] hover:-translate-y-1.5 hover:shadow-[0_28px_50px_-24px_rgba(0,0,0,0.35)]"
    >
      <div className="relative aspect-[16/9] sm:aspect-[16/10] overflow-hidden">
        <img
          src={vendor.imageUrl || vendorImage(vendor.id)}
          alt={`${vendor.name} — ${vendor.cuisine}`}
          loading="lazy"
          width={800}
          height={600}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 media-overlay" />
        <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold text-card-foreground backdrop-blur">
          ⭐ {vendor.rating}
        </span>
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${accentSoftClass[vendor.accent]}`}
        >
          ⏱ {vendor.eta}
        </span>
        <div className="absolute inset-x-4 bottom-3 text-on-media">
          <h3 className="truncate text-lg font-semibold drop-shadow">
            {vendor.name}
          </h3>
          <p className="text-sm opacity-85">{vendor.cuisine}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-4 py-3 sm:gap-2 sm:px-5 sm:py-4">
        {menu.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-semibold">₹{item.price}</span>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <span className="inline-flex w-full items-center justify-center rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity group-hover:opacity-85">
          View menu →
        </span>
      </div>
    </Link>
  );
}
