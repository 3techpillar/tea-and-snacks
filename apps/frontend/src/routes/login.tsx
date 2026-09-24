import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-client";
import { Mail, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import {
  AuthInput,
  AuthPasswordInput,
  AuthErrorBanner,
  AuthSubmitButton,
} from "@/components/auth/AuthComponents";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect:
      typeof search["redirect"] === "string"
        ? (search["redirect"] as string)
        : "/",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Tea & Snacks" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const emailError =
    emailTouched && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      ? "Enter a valid email address"
      : null;
  const passwordError =
    passwordTouched && password.length < 1
      ? "Password is required"
      : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailTouched(true);
    setPasswordTouched(true);
    
    if (emailError || passwordError) return;

    setSubmitting(true);
    try {
      const user = await login({ email: email.trim(), password });
      if (user?.role === "admin") {
        navigate({ to: "/admin/orders" });
      } else if (user?.role === "vendor" && user.vendorId) {
        navigate({
          to: "/vendor/$vendorId",
          params: { vendorId: user.vendorId },
        });
      } else {
        navigate({ to: redirect });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Sign in to your account
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email and password to access your dashboard
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <AuthInput
              id="login-email"
              type="email"
              label="Email address"
              icon={<Mail className="h-4 w-4" />}
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              error={emailError}
            />

            <div className="space-y-1">
              <AuthPasswordInput
                id="login-password"
                label="Password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                error={passwordError}
              />
              
              <div className="flex justify-end pt-1">
                <Link to="/forgot-password" className="text-sm font-semibold text-primary transition-colors hover:text-primary/80">
                  Forgot password?
                </Link>
              </div>
            </div>

            <AuthErrorBanner error={error} />

            <div className="pt-2">
              <AuthSubmitButton loading={submitting} loadingText="Signing in…">
                Sign in
              </AuthSubmitButton>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link
              to="/register"
              search={{ redirect }}
              className="font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Create an account
            </Link>
          </p>
    </AuthLayout>
  );
}
