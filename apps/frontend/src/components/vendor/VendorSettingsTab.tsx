import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { vendorApi } from "@/lib/api/vendor";

export function VendorSettingsTab({
  vendorId,
  vendor,
}: {
  vendorId: string;
  vendor: Record<string, unknown>;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    tagline: (vendor.tagline as string) || "",
    counter: (vendor.counter as string) || "",
    hours: (vendor.hours as string) || "",
    upiId: (vendor.upiId as string) || "",
    isAcceptingOrders: vendor.isAcceptingOrders !== false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      await vendorApi.updateProfile(vendorId, formData);
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update stall profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-4">
      <div>
        <h2 className="text-xl font-bold">Stall Settings</h2>
        <p className="text-sm text-muted-foreground">Update your stall's operational details.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        {error && (
          <div className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl bg-mint-soft p-3 text-sm font-medium text-mint-ink">
            Profile updated successfully!
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Stall Tagline</label>
            <input
              required
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. Best tea in town!"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Location / Counter</label>
              <input
                required
                value={formData.counter}
                onChange={(e) => setFormData({ ...formData, counter: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Ground Floor, Block A"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Operating Hours</label>
              <input
                required
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. 9:00 AM - 6:00 PM"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">UPI ID (For Payments)</label>
            <input
              required
              value={formData.upiId}
              onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="vendor@upi"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="font-semibold">Accepting Orders</p>
              <p className="text-xs text-muted-foreground">
                Turn this off if you are temporarily closed or busy.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, isAcceptingOrders: !formData.isAcceptingOrders })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.isAcceptingOrders ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formData.isAcceptingOrders ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end border-t border-border pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
