import { Mail } from "lucide-react";
import type { PublicUser } from "@tea-and-snacks/shared";

export function ProfileHeader({ user }: { user: PublicUser }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-6 rounded-xl border border-border bg-background p-6 shadow-sm">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary text-2xl font-semibold text-primary-foreground shadow-sm ring-4 ring-background">
        {initials}
      </div>
      <div>
        <h2 className="text-xl font-medium text-foreground">{user.name}</h2>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" /> {user.email}
          </span>
        </div>
      </div>
    </div>
  );
}
