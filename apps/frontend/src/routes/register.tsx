import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-client";
import { authApi } from "@/lib/api/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { OtpVerificationForm } from "@/components/auth/OtpVerificationForm";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || "/",
    };
  },
});

function RegisterPage() {
  const { redirect } = Route.useSearch();
  const { register, verifyEmail } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyOnlyMode, setVerifyOnlyMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  const fieldErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (touched.name && !name.trim()) errs.name = "Name is required";
    if (touched.email) {
      if (!email.trim()) errs.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        errs.email = "Enter a valid email address";
    }
    if (touched.phone) {
      if (!phone.trim()) errs.phone = "Mobile number is required";
      else if (phone.length !== 10) errs.phone = "Must be 10 digits";
      else if (!/^[6-9]/.test(phone))
        errs.phone = "Enter a valid Indian mobile number";
    }
    if (touched.password) {
      if (!password) errs.password = "Password is required";
      else if (password.length < 6)
        errs.password = "Must be at least 6 characters";
    }
    if (touched.confirmPassword && password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    return errs;
  }, [name, email, phone, password, confirmPassword, touched]);

  const isValid =
    name.trim() &&
    email.trim() &&
    phone.length === 10 &&
    /^[6-9]/.test(phone) &&
    password.length >= 6 &&
    password === confirmPassword;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });
    setError(null);

    if (!isValid) return;

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: `+91${phone}`,
        password,
        role: "customer",
      });
      setIsVerifying(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid email address first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authApi.resendOTP(email.trim());
      setIsVerifying(true);
      setOtp(""); // Clear any previous OTP
      setError("A new verification code has been sent!"); // Show success message in error banner temporarily
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setSubmitting(true);
    setError(null);
    try {
      await verifyEmail({ email, otp });
      navigate({ to: redirect });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      {isVerifying ? (
        <OtpVerificationForm
          email={email}
          setEmail={setEmail}
          otp={otp}
          setOtp={setOtp}
          verifyOnlyMode={verifyOnlyMode}
          submitting={submitting}
          error={error}
          fieldErrors={fieldErrors}
          touch={touch}
          submitVerification={submitVerification}
          handleResendOTP={handleResendOTP}
          onGoBack={() => setIsVerifying(false)}
        />
      ) : (
        <RegisterForm
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          phone={phone}
          setPhone={setPhone}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          submitting={submitting}
          error={error}
          fieldErrors={fieldErrors}
          touch={touch}
          submit={submit}
          redirect={redirect}
          onVerifyNowClick={() => {
            setIsVerifying(true);
            setVerifyOnlyMode(true);
            setOtp("");
            setError(null);
          }}
        />
      )}
    </AuthLayout>
  );
}
