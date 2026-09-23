import { QRCodeSVG } from "qrcode.react";
import { accentSoftClass, type Vendor } from "@/lib/data";

export function upiLink(vendor: Vendor, amount: number, note: string) {
  const params = new URLSearchParams({
    pa: vendor.upiId,
    pn: vendor.name,
    am: String(amount),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

export function UpiQr({
  vendor,
  amount,
  note,
}: {
  vendor: Vendor;
  amount: number;
  note: string;
}) {
  const link = upiLink(vendor, amount, note);

  return (
    <div className="surface-card flex items-center gap-4 p-4">
      <div className="rounded-2xl bg-card p-2 ring-1 ring-border">
        <QRCodeSVG value={link} size={104} level="M" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          {vendor.emoji} {vendor.name}
        </p>
        <p className="text-sm text-muted-foreground">{vendor.counter}</p>
        <p className="mt-1 truncate text-sm font-medium">{vendor.upiId}</p>
        <span
          className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-bold ${accentSoftClass[vendor.accent]}`}
        >
          Pay ₹{amount}
        </span>
        <a
          href={link}
          className="mt-2 block text-xs font-bold text-primary underline underline-offset-2"
        >
          Open UPI app
        </a>
      </div>
    </div>
  );
}
