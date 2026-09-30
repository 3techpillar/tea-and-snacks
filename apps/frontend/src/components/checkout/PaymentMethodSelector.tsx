import { UpiQr } from "@/components/UpiQr";

type PaymentMethodSelectorProps = {
  paymentMethod: "online" | "offline";
  setPaymentMethod: (val: "online" | "offline") => void;
  total: number;
  vendorTotals: { vendor: any; amount: number }[];
};

export function PaymentMethodSelector({
  paymentMethod,
  setPaymentMethod,
  total,
  vendorTotals,
}: PaymentMethodSelectorProps) {
  return (
    <>
      <div>
        <p className="text-sm font-semibold">Payment Method</p>
        <div className="mt-2 flex flex-col sm:flex-row gap-3">
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border p-3 font-semibold transition-colors ${
              paymentMethod === "online"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              className="hidden"
              checked={paymentMethod === "online"}
              onChange={() => setPaymentMethod("online")}
            />
            Pay Online (UPI)
          </label>
          <label
            className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border p-3 font-semibold transition-colors ${
              paymentMethod === "offline"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              className="hidden"
              checked={paymentMethod === "offline"}
              onChange={() => setPaymentMethod("offline")}
            />
            Pay at Stall (Offline)
          </label>
        </div>
      </div>

      {paymentMethod === "online" && (
        <>
          <div className="rounded-2xl bg-sky-soft p-4 text-sky-ink">
            <p className="font-semibold">Scan &amp; pay ₹{total} by UPI</p>
            <p className="mt-1 text-sm opacity-85">
              Scan each stall's QR with any UPI app, then upload the payment
              screenshot on the next screen.
            </p>
          </div>

          <div className="grid gap-3">
            {vendorTotals.map(({ vendor, amount }) => (
              <UpiQr
                key={vendor.id}
                vendor={vendor}
                amount={amount}
                note={`Easy Food · ${vendor.name}`}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
