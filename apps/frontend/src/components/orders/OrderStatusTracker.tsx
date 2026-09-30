import { orderStatuses } from "@/lib/orders";
import { Loader2, CheckCircle2 } from "lucide-react";

const displayStatus = (s: string) => (s === "New" ? "Pending" : s);

export function OrderStatusTracker({ order, isCancelled }: { order: any; isCancelled: boolean }) {
  const isCompleted = order.status === "Delivered";
  const stepIndex = isCompleted
    ? orderStatuses.length - 1
    : orderStatuses.indexOf(order.status);

  return (
    <section className="surface-card mt-6 p-5 sm:p-6 shadow-sm border border-border/60 hover:shadow-md transition-shadow rounded-2xl">
      <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-4">
        Live Status
      </h2>
      {isCancelled ? (
        <div className="rounded-xl bg-chili/5 border border-chili/20 p-5 shadow-inner">
          <p className="font-bold text-chili-ink text-base">This order was cancelled.</p>
          {(order.cancellationReason || order.vendorNote) && (
            <p className="mt-2 text-sm text-chili-ink/80 font-medium">
              Reason: {order.cancellationReason || order.vendorNote}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Mobile view: Only show current status */}
          <div className="md:hidden flex items-center gap-4 bg-secondary/30 rounded-xl p-4 border border-secondary/50">
            {isCompleted ? (
              <CheckCircle2 className="h-6 w-6 text-mint-ink" />
            ) : (
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            )}
            <div>
              <p className="font-bold text-lg text-foreground">
                {displayStatus(order.status)}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Step {stepIndex + 1} of {orderStatuses.length}
              </p>
            </div>
          </div>

          {/* Desktop view: Show full progress bar */}
          <div className="hidden md:flex items-center gap-3">
            {orderStatuses.map((s, i) => {
              const isActive = i === stepIndex;
              const isPast = i < stepIndex;
              
              let barColor = "bg-secondary";
              let textColor = "text-muted-foreground/60";
              
              if (isActive) {
                barColor = "bg-primary shadow-sm ring-2 ring-primary/20";
                textColor = "text-primary font-bold";
              } else if (isPast) {
                barColor = "bg-mint";
                textColor = "text-mint-ink font-semibold";
              }

              return (
                <div key={s} className="flex-1 group">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ease-out ${barColor}`}
                  />
                  <p
                    className={`mt-3 text-xs transition-colors duration-300 ${textColor}`}
                  >
                    {displayStatus(s)}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
