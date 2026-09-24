import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Link } from "@tanstack/react-router";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-client";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:h-10 sm:w-10 sm:text-base"
          aria-label="User menu"
        >
          {getInitials(user.name)}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-border bg-background p-1 text-foreground shadow-lg animate-in fade-in-80 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          align="end"
          sideOffset={8}
        >
          <div className="flex flex-col px-3 py-2.5 border-b border-border mb-1">
            <span className="text-sm font-semibold truncate">{user.name}</span>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
          </div>

          <DropdownMenu.Item asChild>
            <Link
              to="/profile"
              className="relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-secondary focus:bg-secondary data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              View Profile
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onClick={() => logout()}
            className="relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-destructive/10 focus:bg-destructive/10 hover:text-destructive focus:text-destructive data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
