import { BUILDINGS } from "@tea-and-snacks/shared";
import { MapPin, User, Phone } from "lucide-react";

export function DeliveryAddressCard({ order }: { order: any }) {
  if (!order.deliveryAddress) return null;
  return (
    <section className="surface-card mt-6 p-5 sm:p-6 shadow-sm border border-border/60 hover:shadow-md transition-shadow rounded-2xl">
      <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2 mb-4">
        <MapPin className="h-4 w-4" /> Delivery Address
      </h2>
      <div className="space-y-4 text-sm">
        <div>
          <p className="font-bold text-foreground text-base">
            {BUILDINGS.find((b) => b.id === order.deliveryAddress!.building)?.name ?? order.deliveryAddress.building}
          </p>
          <p className="text-muted-foreground font-medium mt-0.5">
            Floor {order.deliveryAddress.floor} <span className="mx-1">·</span> Office {order.deliveryAddress.officeNumber}
          </p>
        </div>
        <div className="pt-3 border-t border-border/50 flex flex-col sm:flex-row gap-3 sm:gap-6">
          <p className="flex items-center gap-2 text-muted-foreground font-medium">
            <User className="h-4 w-4 text-foreground/40" /> {order.deliveryAddress.recipientName}
          </p>
          <p className="flex items-center gap-2 text-muted-foreground font-medium">
            <Phone className="h-4 w-4 text-foreground/40" /> {order.deliveryAddress.recipientPhone}
          </p>
        </div>
      </div>
    </section>
  );
}
