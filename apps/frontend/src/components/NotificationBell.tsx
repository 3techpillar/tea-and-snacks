import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-client";
import { useNotificationStore, resolveNotificationUrl, type InAppNotification } from "@/lib/notification-store";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { requestPushPermission, disablePushNotifications } from "@/hooks/useNotifications";

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

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, markAllAsRead, clearAll, removeNotification } =
    useNotificationStore();

  const [pushEnabled, setPushEnabled] = useState(() => {
    return typeof window !== "undefined" && "Notification" in window 
      ? Notification.permission === "granted" && !!localStorage.getItem("fcm_registered_token")
      : false;
  });

  const [isToggling, setIsToggling] = useState(false);

  const handleTogglePush = async (checked: boolean) => {
    setIsToggling(true);
    try {
      if (!checked) {
        await disablePushNotifications();
        setPushEnabled(false);
        toast("Push notifications disabled.");
      } else {
        const success = await requestPushPermission();
        if (success) {
          setPushEnabled(true);
          toast.success("Push notifications enabled!");
        } else {
          if (Notification.permission === "denied") {
            toast.error("Notifications are blocked by your browser. Please enable them in your browser settings.");
          } else {
            toast.error("Failed to enable notifications.");
          }
          setPushEnabled(false);
        }
      }
    } finally {
      setIsToggling(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleNotificationClick(n: InAppNotification) {
    setOpen(false);
    const url = resolveNotificationUrl(
      { type: n.type, orderId: n.orderId },
      user?.role,
      user?.vendorId,
    );
    if (url) {
      navigate({ to: url });
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label={`Notifications, ${unreadCount} unread`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-background shadow-xl sm:w-96 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {pushEnabled ? "Enabled" : "Disabled"}
                </span>
                <Switch
                  checked={pushEnabled}
                  onCheckedChange={handleTogglePush}
                  disabled={isToggling}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </span>
              <div className="flex gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <span className="text-3xl">{pushEnabled ? "🔔" : "🔕"}</span>
                <p className="mt-2 text-sm">{pushEnabled ? "No notifications yet" : "Notifications disabled"}</p>
              </div>
            ) : (
              notifications.slice(0, 3).map((n) => (
                <div
                  key={n.id}
                  className={`group relative flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-secondary/50 ${
                    !n.read ? "bg-primary/5" : ""
                  }`}
                >
                  <button
                    onClick={() => handleNotificationClick(n)}
                    className="flex flex-1 items-start gap-3"
                  >
                    <span className="mt-0.5 text-lg leading-none">
                      {getNotificationIcon(n.type)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`truncate text-sm ${
                            !n.read
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground/80"
                          }`}
                        >
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {n.body}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/60">
                        {timeAgo(n.timestamp)}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(n.id);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    title="Delete notification"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
          
          {/* Footer View All */}
          {notifications.length > 0 && (
            <div className="border-t border-border bg-card p-2 text-center">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/notifications" });
                }}
                className="w-full rounded-md py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                View all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
