import { create } from "zustand";

export type InAppNotification = {
  id: string;
  title: string;
  body: string;
  type?: string;
  orderId?: string;
  read: boolean;
  timestamp: number;
};

type NotificationStore = {
  notifications: InAppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<InAppNotification, "id" | "read" | "timestamp">) => void;
  markAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
};

/**
 * Resolves a notification to a frontend URL based on type and user role.
 * The backend only sends `type` and `orderId` — this function owns the URL mapping.
 */
export function resolveNotificationUrl(
  notification: { type?: string; orderId?: string },
  userRole?: string,
  vendorId?: string,
): string | undefined {
  const { type, orderId } = notification;

  switch (type) {
    case "new_order":
      // Vendor sees their stall dashboard, admin sees admin orders
      if (userRole === "admin") return "/admin/orders";
      if (userRole === "vendor" && vendorId) return `/vendor/${vendorId}`;
      return "/orders";

    case "order_status":
      // Customer sees their specific order detail
      if (orderId) return `/orders/${orderId}`;
      return "/orders";

    case "order_cancelled":
      // Customer sees the cancelled order, vendor sees their dashboard
      if (userRole === "vendor" && vendorId) return `/vendor/${vendorId}`;
      if (orderId) return `/orders/${orderId}`;
      return "/orders";

    default:
      return undefined;
  }
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: loadFromStorage(),
  unreadCount: loadFromStorage().filter((n) => !n.read).length,

  addNotification: (n) => {
    const newNotification: InAppNotification = {
      ...n,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      read: false,
      timestamp: Date.now(),
    };
    const updated = [newNotification, ...get().notifications].slice(0, 50); // Keep last 50
    saveToStorage(updated);
    set({
      notifications: updated,
      unreadCount: updated.filter((x) => !x.read).length,
    });
  },

  markAsRead: (id) => {
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    saveToStorage(updated);
    set({
      notifications: updated,
      unreadCount: updated.filter((x) => !x.read).length,
    });
  },

  removeNotification: (id) => {
    const updated = get().notifications.filter((n) => n.id !== id);
    saveToStorage(updated);
    set({
      notifications: updated,
      unreadCount: updated.filter((x) => !x.read).length,
    });
  },

  markAllAsRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, read: true }));
    saveToStorage(updated);
    set({ notifications: updated, unreadCount: 0 });
  },

  clearAll: () => {
    saveToStorage([]);
    set({ notifications: [], unreadCount: 0 });
  },
}));

// LocalStorage persistence
const STORAGE_KEY = "app_notifications";

function loadFromStorage(): InAppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(notifications: InAppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    // Silently fail if storage is full
  }
}
