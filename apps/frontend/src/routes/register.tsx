import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-client";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect:
      typeof search["redirect"] === "string"
        ? (search["redirect"] as string)
        : "/",
  }),
  head: () => ({
    meta: [
      { title: "Create account — Tea & Snacks" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegisterPage,
});

type StrengthLevel = "weak" | "fair" | "strong" | "very-strong";

function getPasswordStrength(pw: string): {
  level: StrengthLevel;
  label: string;
  percent: number;
} {
  if (pw.length === 0) return { level: "weak", label: "", percent: 0 };

  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: "weak", label: "Weak", percent: 20 };
  if (score <= 2) return { level: "fair", label: "Fair", percent: 45 };
  if (score <= 3) return { level: "strong", label: "Strong", percent: 70 };
  return { level: "very-strong", label: "Very strong", percent: 100 };
}

const strengthColors: Record<StrengthLevel, string> = {
  weak: "var(--destructive)",
  fair: "var(--mango)",
  strong: "var(--mint)",
  "very-strong": "var(--mint)",
};

function RegisterPage() {
  const { redirect } = Route.useSearch();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const touch = (field: keyof typeof touched) =>
    setTouched((t) => ({ ...t, [field]: true }));

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const fieldErrors = {
    name:
      touched.name && name.trim().length < 2
        ? "Name must be at least 2 characters"
        : null,
    email:
      touched.email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        ? "Enter a valid email address"
        : null,
    password:
      touched.password && password.length < 6
        ? "Password must be at least 6 characters"
        : null,
    confirmPassword:
      touched.confirmPassword && confirmPassword !== password
        ? "Passwords do not match"
        : null,
  };

  const isValid =
    name.trim().length >= 2 &&
    email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) &&
    password.length >= 6 &&
    confirmPassword === password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    if (!isValid) return;

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role: "customer",
      });
      navigate({ to: redirect });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="auth-card w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl gradient-hero text-2xl shadow-[var(--shadow-pop)]">
            🍽️
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign up to place orders and track them from any device
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="auth-field-group">
            <label htmlFor="reg-name" className="auth-label">
              Full name
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                id="reg-name"
                required
                autoComplete="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => touch("name")}
                className={`auth-input ${fieldErrors.name ? "auth-input-error" : ""}`}
              />
            </div>
            {fieldErrors.name && (
              <p className="auth-error-text">{fieldErrors.name}</p>
            )}
          </div>

          <div className="auth-field-group">
            <label htmlFor="reg-email" className="auth-label">
              Email address
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </span>
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => touch("email")}
                className={`auth-input ${fieldErrors.email ? "auth-input-error" : ""}`}
              />
            </div>
            {fieldErrors.email && (
              <p className="auth-error-text">{fieldErrors.email}</p>
            )}
          </div>

          <div className="auth-field-group">
            <label htmlFor="reg-phone" className="auth-label">
              Phone <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </span>
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-field-group">
            <label htmlFor="reg-password" className="auth-label">
              Password
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => touch("password")}
                className={`auth-input ${fieldErrors.password ? "auth-input-error" : ""}`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="auth-toggle-password"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" x2="23" y1="1" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="auth-error-text">{fieldErrors.password}</p>
            )}

            {password.length > 0 && (
              <div className="mt-2">
                <div className="auth-strength-track">
                  <div
                    className="auth-strength-bar"
                    style={{
                      width: `${strength.percent}%`,
                      backgroundColor: strengthColors[strength.level],
                    }}
                  />
                </div>
                <p
                  className="mt-1 text-xs font-medium"
                  style={{ color: strengthColors[strength.level] }}
                >
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          <div className="auth-field-group">
            <label htmlFor="reg-confirm-password" className="auth-label">
              Confirm password
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </span>
              <input
                id="reg-confirm-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => touch("confirmPassword")}
                className={`auth-input ${fieldErrors.confirmPassword ? "auth-input-error" : ""}`}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="auth-error-text">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {error && (
            <div className="auth-error-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" x2="12" y1="8" y2="12"/>
                <line x1="12" x2="12.01" y1="16" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="auth-submit-btn"
          >
            {submitting ? (
              <>
                <span className="auth-spinner" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            search={{ redirect }}
            className="font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
