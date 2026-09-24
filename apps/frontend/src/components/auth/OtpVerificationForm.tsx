import { Mail } from "lucide-react";
import { AuthInput, AuthErrorBanner, AuthSubmitButton } from "./AuthComponents";
import React from "react";

interface OtpVerificationFormProps {
  email: string;
  setEmail: (email: string) => void;
  otp: string;
  setOtp: (otp: string) => void;
  verifyOnlyMode: boolean;
  submitting: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  touch: (field: string) => void;
  submitVerification: (e: React.FormEvent) => Promise<void>;
  handleResendOTP: () => Promise<void>;
  onGoBack: () => void;
}

export function OtpVerificationForm({
  email,
  setEmail,
  otp,
  setOtp,
  verifyOnlyMode,
  submitting,
  error,
  fieldErrors,
  touch,
  submitVerification,
  handleResendOTP,
  onGoBack,
}: OtpVerificationFormProps) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
        <Mail className="h-8 w-8" />
      </div>
      <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">
        {verifyOnlyMode ? "Verify your account" : "Check your email"}
      </h2>
      
      {verifyOnlyMode ? (
        <p className="mt-2 text-sm text-muted-foreground mb-8">
          Enter your email and the 6-digit verification code.
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground mb-8">
          We sent a 6-digit verification code to <strong className="text-foreground">{email}</strong>
        </p>
      )}

      <form onSubmit={submitVerification} className="space-y-6">
        {verifyOnlyMode && (
          <div className="text-left">
            <AuthInput
              id="verify-email"
              type="email"
              label="Email address *"
              icon={<Mail className="h-4 w-4" />}
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => touch("email")}
              error={fieldErrors.email}
            />
          </div>
        )}

        <div className="flex justify-center">
          <div className="flex gap-2">
            {[...Array(6)].map((_, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                autoComplete="one-time-code"
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

        <AuthErrorBanner error={error} />

        <div className="pt-2">
          <AuthSubmitButton 
            loading={submitting} 
            disabled={otp.length !== 6} 
            loadingText="Verifying..."
          >
            Verify Email
          </AuthSubmitButton>
        </div>
      </form>
      
      <div className="mt-6 flex flex-col items-center gap-2">
        <button 
          type="button"
          onClick={handleResendOTP}
          disabled={submitting}
          className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Resend OTP
        </button>
        <button 
          type="button"
          onClick={onGoBack}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Wrong email address? Go back
        </button>
      </div>
    </div>
  );
}
