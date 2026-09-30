export function OrderHero({ order }: { order: any }) {
  return (
    <section className="rounded-3xl gradient-hero px-8 py-10 text-primary-foreground shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
      <div className="relative z-10">
        <p className="text-xs uppercase tracking-[0.25em] opacity-80 font-bold mb-2">
          Order Confirmed
        </p>
        <h1 className="text-4xl font-black tracking-tight drop-shadow-sm">Token {order.token}</h1>
        <p className="mt-2 opacity-90 font-medium text-lg">
          Order #{order.id} <span className="mx-1 opacity-50">·</span> {order.customer}
        </p>
      </div>
    </section>
  );
}
