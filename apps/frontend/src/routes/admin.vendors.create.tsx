import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { VendorForm } from "@/components/admin/VendorForm";

export const Route = createFileRoute("/admin/vendors/create")({
  component: CreateVendorPage,
});

function CreateVendorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInfo, setCreatedInfo] = useState<{email: string, password: string} | null>(null);

  // OTP State
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (data: any, file: File | null) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = "";
      if (file) {
        const formDataUpload = new FormData();
        formDataUpload.append("image", file);
        const API_BASE = import.meta.env.VITE_API_URL ?? "";
        const res = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          body: formDataUpload,
          credentials: "include"
        });
        if (!res.ok) throw new Error("Image upload failed");
        const json = await res.json();
        imageUrl = json.data?.imageUrl || json.imageUrl;
      }

      const res = await adminApi.createVendor({
        ...data,
        imageUrl
      });
      
      if (res.requiresOtp && res.email) {
        setOtpEmail(res.email);
      } else {
        setCreatedInfo(res.defaultAccount);
        queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      }
    } catch (err: any) {
      setError(err.message || "Failed to create vendor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail) return;
    
    setIsVerifying(true);
    setOtpError(null);
    try {
      const res = await adminApi.verifyVendorOtp({ email: otpEmail, otp });
      setCreatedInfo(res.defaultAccount);
      setOtpEmail(null);
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
    } catch (err: any) {
      setOtpError(err.message || "Invalid OTP");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpEmail) return;
    setIsResending(true);
    setOtpError(null);
    try {
      await adminApi.resendVendorOtp(otpEmail);
      alert("A new OTP has been sent to the vendor's email.");
    } catch (err: any) {
      setOtpError(err.message || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  if (createdInfo) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-mint-soft text-3xl">
            🎉
          </div>
          <h2 className="text-2xl font-bold text-mint-ink">Stall Created Successfully!</h2>
          <p className="mt-2 text-muted-foreground">Please share these default credentials with the stall owner.</p>
          
          <div className="mx-auto mt-8 max-w-md rounded-xl bg-accent/50 p-6 text-left font-mono text-sm shadow-inner">
            <div className="mb-4">
              <span className="text-muted-foreground">Email URL:</span><br />
              <strong className="text-foreground text-base">{createdInfo.email}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Password:</span><br />
              <strong className="text-foreground text-base">{createdInfo.password}</strong>
            </div>
          </div>

          <button 
            onClick={() => navigate({ to: "/admin/vendors" })} 
            className="mt-8 rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to Vendors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 pt-4">
      <div className="mb-8 flex items-center gap-4">
        <button 
          onClick={() => window.history.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-muted-foreground transition-colors hover:bg-accent/80 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Stall</h1>
          <p className="text-sm text-muted-foreground">Add a new vendor to the Easy Food platform.</p>
        </div>
      </div>

      <VendorForm 
        onSubmit={handleSubmit} 
        isSubmitting={isSubmitting} 
        error={error} 
        submitLabel="Create Stall" 
      />

      {otpEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border">
            <h2 className="text-xl font-bold">Verify Vendor Email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              An OTP has been sent to <strong>{otpEmail}</strong>. Please ask the vendor for the OTP to activate their stall account.
            </p>
            
            {otpError && (
              <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <div>
                <input 
                  required
                  autoFocus
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-center text-xl font-mono tracking-[0.2em] transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  maxLength={6}
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={isVerifying || otp.length < 4}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isVerifying && <Loader2 className="h-4 w-4 animate-spin" />}
                  Verify & Activate Stall
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="text-sm font-semibold text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
                >
                  {isResending ? "Resending..." : "OTP Expired? Resend Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
