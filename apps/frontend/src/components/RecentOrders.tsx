import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ordersApi } from "@/lib/api/orders";
import { statusToneClass } from "@/lib/orders";
import { useAuth } from "@/lib/auth-client";
import { ShoppingBag, ArrowRight } from "lucide-react";

export function RecentOrders() {
  const { user } = useAuth();
  
  const ordersQuery = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: () => ordersApi.list(),
    enabled: !!user,
  });

  const orders = ordersQuery.data?.slice(0, 3) ?? [];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
        <div>
          <h3 className="text-base font-medium">Recent Orders</h3>
          <p className="text-sm text-muted-foreground">Your latest food orders</p>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        {ordersQuery.isLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground py-8">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center py-8">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">No recent orders</p>
            <p className="text-xs text-muted-foreground mt-1">When you place an order, it will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((o) => (
              <Link
                key={o.id}
                to="/orders/$orderId"
                params={{ orderId: o.id }}
                className="group flex flex-col gap-2 rounded-lg border border-border p-4 transition-all hover:border-primary/30 hover:bg-secondary/30 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                    Order #{o.id}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusToneClass[o.status]}`}>
                    {o.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{o.items.reduce((s, i) => s + i.qty, 0)} items</span>
                  <span className="font-medium text-foreground">₹{o.total}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {!ordersQuery.isLoading && ordersQuery.data && ordersQuery.data.length > 3 && (
          <div className="mt-6 flex justify-center border-t border-border pt-6">
            <Link 
              to="/orders" 
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline transition-colors hover:text-primary/80"
            >
              View all order history <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
