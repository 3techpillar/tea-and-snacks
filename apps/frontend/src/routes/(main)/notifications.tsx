import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useNotificationStore, resolveNotificationUrl } from "@/lib/notification-store";
import { useAuth } from "@/lib/auth-client";
import { Bell, Check, Trash2 } from "lucide-react";

export const Route = createFileRoute("/(main)/notifications")({
  head: () => ({
    meta: [{ title: "Notifications — Tea & Snacks" }],
  }),
  component: NotificationsPage,
});

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getNotificationIcon(type?: string) {
  switch (type) {
    case "new_order":
      return "🔔";
    case "order_status":
      return "📦";
    case "order_cancelled":
      return "❌";
    default:
      return "🔔";
  }
}

function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllAsRead, clearAll, removeNotification, markAsRead } =
    useNotificationStore();

  const handleNotificationClick = (n: any) => {
    if (!n.read) {
      markAsRead(n.id);
    }
    const url = resolveNotificationUrl(n, user?.role, user?.vendorId);
    if (url) {
      navigate({ to: url as any });
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            <Bell className="h-6 w-6 text-primary" />
            Your Notifications
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
              : "You're all caught up!"}
          </p>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear all</span>
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <span className="text-5xl">🔕</span>
            <h3 className="mt-4 text-lg font-semibold text-foreground">No notifications yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">When you get updates, they'll show up here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`group relative flex items-start gap-4 p-4 transition-colors hover:bg-secondary/30 sm:p-5 ${
                  !n.read ? "bg-primary/5" : ""
                }`}
              >
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xl">
                  {getNotificationIcon(n.type)}
                </div>
                
                <button
                  onClick={() => handleNotificationClick(n)}
                  className="flex flex-1 flex-col items-start text-left"
                >
                  <div className="flex w-full items-center justify-between">
                    <p
                      className={`text-base ${
                        !n.read
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground/80"
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground/80">
                      {timeAgo(n.timestamp)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {n.body}
                  </p>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(n.id);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus:opacity-100 group-hover:opacity-100"
                  aria-label="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                {!n.read && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
