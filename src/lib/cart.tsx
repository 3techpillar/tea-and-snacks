import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCatalog } from "./catalog-client";
import type { Product } from "./data";

export type CartLine = { productId: string; qty: number };

type CartContextValue = {
  lines: CartLine[];
  add: (productId: string) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  hydrated: boolean;
  count: number;
  total: number;
  detailed: { product: Product; qty: number }[];
};

const emptyCart: CartContextValue = {
  lines: [],
  detailed: [],
  count: 0,
  total: 0,
  add: () => {},
  remove: () => {},
  setQty: () => {},
  clear: () => {},
  hydrated: false,
};

const CartContext = createContext<CartContextValue>(emptyCart);
const STORAGE_KEY = "easy-food-cart";

// Guards the app against a crash if `easy-food-cart` ever holds something
// other than the expected shape (e.g. edited via devtools, or left over from
// a schema change) — CartProvider wraps every route, so an unvalidated
// `setLines` here used to be able to take down the whole app.
function isCartLineArray(value: unknown): value is CartLine[] {
  return (
    Array.isArray(value) &&
    value.every(
      (l) =>
        l &&
        typeof l === "object" &&
        typeof (l as CartLine).productId === "string" &&
        typeof (l as CartLine).qty === "number" &&
        (l as CartLine).qty > 0,
    )
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useCatalog();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (isCartLineArray(parsed)) setLines(parsed);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines]);

  // Keep the cart in sync across tabs on the same device — e.g. checkout
  // clearing the cart in one tab must not leave a stale, non-empty cart in
  // another tab that could be re-submitted as a duplicate order.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const parsed: unknown = e.newValue ? JSON.parse(e.newValue) : [];
        if (isCartLineArray(parsed)) setLines(parsed);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const detailed = lines
      .map((l) => {
        const product = products.find((p) => p.id === l.productId);
        return product ? { product, qty: l.qty } : null;
      })
      .filter(Boolean) as { product: Product; qty: number }[];

    return {
      lines,
      hydrated,
      detailed,
      count: lines.reduce((s, l) => s + l.qty, 0),
      total: detailed.reduce((s, d) => s + d.product.price * d.qty, 0),
      add: (productId) =>
        setLines((prev) => {
          const found = prev.find((l) => l.productId === productId);
          return found
            ? prev.map((l) =>
                l.productId === productId ? { ...l, qty: l.qty + 1 } : l,
              )
            : [...prev, { productId, qty: 1 }];
        }),
      remove: (productId) =>
        setLines((prev) => prev.filter((l) => l.productId !== productId)),
      setQty: (productId, qty) =>
        setLines((prev) =>
          qty <= 0
            ? prev.filter((l) => l.productId !== productId)
            : prev.map((l) => (l.productId === productId ? { ...l, qty } : l)),
        ),
      clear: () => setLines([]),
    };
  }, [lines, hydrated, products]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
