import type { Product, ProductVariant } from "@tea-and-snacks/shared";

type OrderSummaryProps = {
  detailed: { product: Product; variant?: ProductVariant; qty: number }[];
  total: number;
};

export function OrderSummary({ detailed, total }: OrderSummaryProps) {
  return (
    <aside className="surface-card h-fit p-5">
      <h2 className="text-lg font-semibold">Order summary</h2>
      <div className="mt-3 space-y-2 text-sm">
        {detailed.map(({ product, qty }) => (
          <div key={product.id} className="flex justify-between">
            <span className="text-muted-foreground">
              {qty} × {product.emoji} {product.name}
            </span>
            <span className="font-semibold">₹{product.price * qty}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between border-t border-border pt-3 font-bold">
        <span>Total</span>
        <span>₹{total}</span>
      </div>
    </aside>
  );
}
