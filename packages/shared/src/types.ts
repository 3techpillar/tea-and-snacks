// ── Catalog types ──────────────────────────────────────────────────

export type AccentColor = "mango" | "chili" | "mint" | "berry" | "sky" | "grape";

export type Product = {
  id: string;
  vendorId: string;
  name: string;
  price: number;
  emoji: string;
  veg: boolean;
  tag?: string;
  imageUrl?: string;
  isAvailable?: boolean;
};

export type Vendor = {
  id: string;
  name: string;
  cuisine: string;
  emoji: string;
  rating: number;
  eta: string;
  accent: AccentColor;
  tagline: string;
  counter: string;
  hours: string;
  specialty: string;
  upiId: string;
  highlights: string[];
  imageUrl?: string;
  isActive?: boolean;
  isAcceptingOrders?: boolean;
};

export type Offer = {
  id: string;
  title: string;
  detail: string;
  code: string;
  accent: AccentColor;
};

export type Catalog = {
  vendors: Vendor[];
  products: Product[];
  offers: Offer[];
};

// ── Auth types ─────────────────────────────────────────────────────

export type UserRole = "customer" | "vendor" | "admin";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  vendorId?: string;
  isActive: boolean;
};

/** Returned by login / register / refresh endpoints. */
export type AuthResponse = {
  user: PublicUser;
};

/** Shape of a token pair (only used internally, tokens travel via cookies). */
export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

// ── Order types ────────────────────────────────────────────────────

export type OrderStatus =
  | "Pending"
  | "Accepted"
  | "Preparing"
  | "Ready"
  | "Completed"
  | "Cancelled";

export type OrderItem = {
  productId?: string;
  vendorId?: string;
  name: string;
  emoji: string;
  qty: number;
  price: number;
};

export type DemoOrder = {
  id: string;
  token: string;
  customer: string;
  phone: string;
  status: OrderStatus;
  placedAt: string;
  paymentConfirmed: boolean;
  paymentRejected?: boolean;
  vendorNote?: string;
  paymentProofName?: string;
  paymentProofUrl?: string;
  items: OrderItem[];
  total: number;
  /** Set when admin cancelled this order at an unresponsive vendor. */
  needsRebooking?: boolean;
  /** Shown to the customer when admin intervenes. */
  adminNote?: string;
};

/** Richer view used only by the admin dashboard. */
export type AdminOrderView = DemoOrder & {
  statusUpdatedAt: string;
  lastVendorNotifiedAt?: string;
  isDelayed: boolean;
  minutesInStatus: number;
};
