import { UpiQr } from "@/components/UpiQr";

export function PaymentSection({
  order,
  payQrs,
  uploadProof,
  onUpload,
  setShowProof,
}: {
  order: any;
  payQrs: any[];
  uploadProof: any;
  onUpload: (file: File | undefined) => void;
  setShowProof: (show: boolean) => void;
}) {
  return (
    <section className="surface-card mt-6 p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
      <h2 className="text-lg font-bold tracking-tight">Payment</h2>
      {order.paymentMethod === "offline" ? (
        <p className="mt-2 text-sm text-muted-foreground font-medium">
          Please pay ₹{order.total} at the stall.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground font-medium">
            Scan the stall QR below to pay ₹{order.total}, then upload the
            screenshot.
          </p>

          {!order.paymentConfirmed && (
            <div className="mt-5 grid gap-4">
              {payQrs.map(({ vendor, amount }: any) => (
                <UpiQr
                  key={vendor.id}
                  vendor={vendor}
                  amount={amount}
                  note={`Easy Food order ${order.id}`}
                />
              ))}
            </div>
          )}
          <label className="mt-6 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 px-6 py-8 text-center group">
            {order.paymentProofUrl ? (
              <img
                src={order.paymentProofUrl}
                alt={`Payment screenshot for order ${order.id}`}
                className="max-h-64 w-full rounded-xl object-contain shadow-sm border border-border/50"
              />
            ) : (
              <div className="p-4 bg-background rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl block">📸</span>
              </div>
            )}
            <span className="mt-4 text-sm font-bold text-primary group-hover:text-primary/80 transition-colors">
              {uploadProof.isPending
                ? "Uploading…"
                : order.paymentProofName
                  ? `Uploaded: ${order.paymentProofName} · Tap to replace`
                  : "Upload payment screenshot"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onUpload(e.target.files?.[0])}
            />
          </label>
          {uploadProof.isError && (
            <p className="mt-2 text-sm font-medium text-destructive">
              {uploadProof.error instanceof Error
                ? uploadProof.error.message
                : "Upload failed."}
            </p>
          )}
          {order.paymentProofUrl && (
            <button
              onClick={() => setShowProof(true)}
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Open full screenshot
            </button>
          )}
          <div className="mt-5 p-4 rounded-xl bg-secondary/30 border border-secondary flex flex-col gap-1">
            <p className="text-sm font-medium">
              Payment Status:{" "}
              <span
                className={
                  order.paymentConfirmed || order.paymentProofUrl
                    ? "font-bold text-mint-ink"
                    : "font-semibold text-muted-foreground"
                }
              >
                {order.paymentConfirmed
                  ? "Payment confirmed"
                  : order.paymentRejected
                    ? "Payment rejected — please re-upload"
                    : order.paymentProofUrl
                      ? "Paid (Pending vendor check)"
                      : "Awaiting payment"}
              </span>
            </p>
          </div>
          {order.vendorNote && (
            <p className="mt-3 rounded-xl bg-mango/10 border border-mango/20 px-4 py-3 text-sm font-medium text-mango-ink shadow-sm">
              <span className="font-bold block mb-0.5">Note from vendor:</span>{" "}
              {order.vendorNote}
            </p>
          )}
        </>
      )}
    </section>
  );
}
