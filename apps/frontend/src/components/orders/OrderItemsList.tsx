export function OrderItemsList({ order }: { order: any }) {
  return (
    <section className="surface-card mt-6 p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
      <h2 className="text-lg font-bold tracking-tight">Items</h2>
      <div className="mt-4 space-y-3 text-sm">
        {order.items.map((i: any, idx: number) => (
          <div
            key={i.variantId ? `${i.productId}-${i.variantId}` : i.productId ?? `${i.name}-${idx}`}
            className="flex justify-between items-center group"
          >
            <span className="text-muted-foreground font-medium flex items-center gap-2">
              <span className="bg-secondary/70 text-foreground px-2 py-0.5 rounded-md text-xs font-bold">{i.qty}×</span>
              <span>{i.emoji} {i.name} {i.variantName ? <span className="text-xs opacity-70">({i.variantName})</span> : ""}</span>
            </span>
            <span className="font-bold text-foreground">₹{i.price * i.qty}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between border-t border-border/50 pt-4 font-black text-base">
        <span>Total</span>
        <span className="text-primary">₹{order.total}</span>
      </div>
    </section>
  );
}
