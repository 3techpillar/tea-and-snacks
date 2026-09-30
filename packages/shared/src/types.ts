// ── Catalog types ──────────────────────────────────────────────────

export type AccentColor = "mango" | "chili" | "mint" | "berry" | "sky" | "grape";

// ── Location types ────────────────────────────────────────────────

export const BUILDINGS = [
  { id: "gaur-city-center", name: "Gaur City Center" },
  { id: "gaur-city-mall",   name: "Gaur City Mall" },
] as const;

export type BuildingId = typeof BUILDINGS[number]["id"];

export type DeliveryAddress = {
  building: BuildingId;
  floor: string;
  officeNumber: string;
  recipientName: string;
  recipientPhone: string;
};

export type VendorLocation = {
  building?: BuildingId;
  floor: string;
  stallNumber: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  price: number;
};

export type Product = {
  id: string;
  vendorId: string;
  name: string;
  price: number;
  emoji: string;
  veg: boolean;
  tag?: string;
  imageUrl?: string;
  isAvailable?: boolean; // Deprecated, use status instead
  status?: "available" | "unavailable" | "out_of_stock" | "coming_soon";
  prepTime?: number | null; // e.g. 10, 20, 30. null means system standard
  isQuickDelivery?: boolean;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  variantLabel?: string;
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
  hours: string;
  specialty: string;
  upiId: string;
  highlights: string[];
  imageUrl?: string;
  location?: VendorLocation;
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

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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
  defaultAddress?: {
    building: string;
    floor: string;
    officeNumber: string;
  };
};

export type AdminUserView = PublicUser & {
  createdAt: string;
  isVerified: boolean;
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
  | "New"
  | "Accepted"
  | "Preparing"
  | "Out for Delivery"
  | "Delivered"
  | "Rejected"
  | "Cancelled";

export type OrderItem = {
  productId?: string;
  vendorId?: string;
  name: string;
  variantId?: string;
  variantName?: string;
  emoji: string;
  qty: number;
  price: number;
};

export type OrderMessage = {
  senderRole: "customer" | "vendor" | "admin";
  senderName: string;
  text: string;
  timestamp: string;
};

export type PublicOrder = {
  id: string;
  token: string;
  customer: string;
  phone: string;
  status: OrderStatus;
  placedAt: string;
  paymentConfirmed: boolean;
  paymentMethod?: "online" | "offline";
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
  messages: OrderMessage[];
  deliveryAddress?: DeliveryAddress;
  cancelledBy?: "customer" | "vendor" | "admin";
  cancellationReason?: string;
};

/** Richer view used only by the admin dashboard. */
export type AdminOrderView = PublicOrder & {
  statusUpdatedAt: string;
  lastVendorNotifiedAt?: string;
  isDelayed: boolean;
  minutesInStatus: number;
};
