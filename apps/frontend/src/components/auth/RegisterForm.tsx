import { User, Mail, Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { 
  AuthInput, 
  AuthPasswordInput, 
  AuthErrorBanner, 
  AuthSubmitButton 
} from "./AuthComponents";

export type StrengthLevel = "weak" | "fair" | "strong" | "very-strong";

export function getPasswordStrength(pw: string): {
  level: StrengthLevel;
  label: string;
  percent: number;
} {
  if (!pw) return { level: "weak", label: "", percent: 0 };
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

export const strengthColors: Record<StrengthLevel, string> = {
  weak: "var(--destructive)",
  fair: "var(--mango)",
  strong: "var(--mint)",
  "very-strong": "var(--mint)",
};

interface RegisterFormProps {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  submitting: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  touch: (field: string) => void;
  submit: (e: React.FormEvent) => Promise<void>;
  onVerifyNowClick: () => void;
  redirect: string;
}

export function RegisterForm({
  name, setName,
  email, setEmail,
  phone, setPhone,
  password, setPassword,
  confirmPassword, setConfirmPassword,
  submitting, error, fieldErrors, touch,
  submit, onVerifyNowClick, redirect
}: RegisterFormProps) {
  const strength = getPasswordStrength(password);

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign up to place orders and track them from any device
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <AuthInput
          id="reg-name"
          label="Full name *"
          icon={<User className="h-4 w-4" />}
          required
          autoComplete="name"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => touch("name")}
          error={fieldErrors.name}
        />

        <AuthInput
          id="reg-email"
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

        <AuthInput
          id="reg-phone"
          type="tel"
          label="Mobile number *"
          icon={<Phone className="h-4 w-4" />}
          prefix="+91"
          required
          maxLength={10}
          autoComplete="tel-national"
          placeholder="98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          onBlur={() => touch("phone")}
          error={fieldErrors.phone}
        />

        <div className="space-y-1">
          <AuthPasswordInput
            id="reg-password"
            label="Password *"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => touch("password")}
            error={fieldErrors.password}
          />

          {password.length > 0 && (
            <div>
              <div className="auth-strength-track mt-2">
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

        <AuthPasswordInput
          id="reg-confirm-password"
          label="Confirm password *"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => touch("confirmPassword")}
          error={fieldErrors.confirmPassword}
        />

        <AuthErrorBanner error={error} />

        <div className="pt-2">
          <AuthSubmitButton loading={submitting} loadingText="Creating account…">
            Create account
          </AuthSubmitButton>
        </div>
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

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Unverified account?{" "}
        <button
          type="button"
          onClick={onVerifyNowClick}
          className="font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Verify now
        </button>
      </p>
    </>
  );
}
