import { User, Mail, Phone, Tag, MapPin, Building2 } from "lucide-react";
import { BUILDINGS } from "@tea-and-snacks/shared";
import type { PublicUser } from "@tea-and-snacks/shared";

export function ProfileView({ user }: { user: PublicUser }) {
  const savedBuilding = BUILDINGS.find(
    (b) => b.id === user.defaultAddress?.building
  );

  return (
    <dl className="grid gap-6 sm:grid-cols-2">
      <div>
        <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <User className="h-4 w-4" /> Full Name
        </dt>
        <dd className="mt-1 text-sm font-medium">{user.name}</dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Mail className="h-4 w-4" /> Email Address
        </dt>
        <dd className="mt-1 text-sm font-medium">{user.email}</dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Phone className="h-4 w-4" /> Phone Number
        </dt>
        <dd className="mt-1 text-sm font-medium">
          {user.phone || (
            <span className="text-muted-foreground italic">Not provided</span>
          )}
        </dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Tag className="h-4 w-4" /> Account Role
        </dt>
        <dd className="mt-1 text-sm font-medium capitalize inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
          {user.role}
        </dd>
      </div>

      <div className="sm:col-span-2 pt-4 border-t border-border/50">
        <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4" /> Default Delivery Address
        </dt>
        {user.defaultAddress ? (
          <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 max-w-sm">
            <p className="font-semibold text-sm flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-primary/70" />
              {savedBuilding?.name ?? user.defaultAddress.building}
            </p>
            <p className="text-sm text-muted-foreground ml-6">
              Floor {user.defaultAddress.floor} <span className="mx-1">·</span>{" "}
              Office {user.defaultAddress.officeNumber}
            </p>
          </div>
        ) : (
          <dd className="text-sm text-muted-foreground italic">
            No default address saved
          </dd>
        )}
      </div>
    </dl>
  );
}
