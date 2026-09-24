import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authApi } from "@/lib/api/auth";
import { Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import {
  AuthInput,
  AuthPasswordInput,
  AuthErrorBanner,
  AuthSubmitButton,
} from "@/components/auth/AuthComponents";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Forgot Password — Easy Food" }],
  }),
  component: ForgotPasswordPage,
});

type Step = "email" | "otp" | "password" | "success";

function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid email address");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authApi.forgotPassword(email);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setStep("password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await authApi.resetPassword({ email, otp, newPassword });
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center">
          
          {step === "email" && (
            <>
              <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">Forgot Password</h2>
              <p className="mt-2 text-sm text-muted-foreground mb-8">
                Enter your email address and we'll send you a 6-digit recovery code.
              </p>

              <form onSubmit={handleSendEmail} className="space-y-4 text-left">
                <AuthInput
                  id="reset-email"
                  type="email"
                  label="Email address"
                  icon={<Mail className="h-4 w-4" />}
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <AuthErrorBanner error={error} />

                <div className="pt-2">
                  <AuthSubmitButton loading={submitting} loadingText="Sending...">
                    Send Recovery Code
                  </AuthSubmitButton>
                </div>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">Check your email</h2>
              <p className="mt-2 text-sm text-muted-foreground mb-8">
                We sent a 6-digit verification code to <strong className="text-foreground">{email}</strong>
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex justify-center">
                  <div className="flex gap-2">
                    {[...Array(6)].map((_, i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength={1}
                        value={otp[i] || ""}
                        onChange={(e) => {
                          const newOtp = otp.split("");
                          newOtp[i] = e.target.value;
                          setOtp(newOtp.join(""));
                          if (e.target.value && e.target.nextSibling) {
                            (e.target.nextSibling as HTMLInputElement).focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !otp[i] && e.currentTarget.previousSibling) {
                            (e.currentTarget.previousSibling as HTMLInputElement).focus();
                          }
                        }}
                        className="h-12 w-12 rounded-md border border-input bg-background text-center text-lg font-semibold shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    ))}
                  </div>
                </div>

                <AuthSubmitButton loading={false} disabled={otp.length !== 6}>
                  Continue
                </AuthSubmitButton>
              </form>

              <button 
                onClick={() => setStep("email")}
                className="mt-6 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Wrong email address? Go back
              </button>
            </>
          )}

          {step === "password" && (
            <>
              <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">Create new password</h2>
              <p className="mt-2 text-sm text-muted-foreground mb-8">
                Your new password must be at least 6 characters.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4 text-left">
                <AuthPasswordInput
                  id="new-password"
                  label="New Password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <AuthPasswordInput
                  id="confirm-password"
                  label="Confirm Password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <AuthErrorBanner error={error} />

                <div className="pt-2">
                  <AuthSubmitButton loading={submitting} loadingText="Saving...">
                    Reset Password
                  </AuthSubmitButton>
                </div>
              </form>
            </>
          )}

          {step === "success" && (
            <>
              <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-mint/20 text-mint">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">All set!</h2>
              <p className="mt-2 text-sm text-muted-foreground mb-8">
                Your password has been successfully reset.
              </p>
              <Link to="/login" className="auth-submit-btn w-full block">
                Sign in to your account
              </Link>
            </>
          )}

          {step === "email" && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link to="/login" className="font-semibold text-primary transition-colors hover:text-primary/80">
                Sign in
              </Link>
            </p>
          )}
      </div>
    </AuthLayout>
  );
}
