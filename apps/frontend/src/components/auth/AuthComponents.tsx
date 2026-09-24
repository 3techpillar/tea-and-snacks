import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Mail, Lock, User, Phone, AlertCircle, Eye, EyeOff } from "lucide-react";

interface BaseInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  icon?: ReactNode;
  prefix?: string;
}

export function AuthInput({ label, error, icon, prefix, className = "", ...props }: BaseInputProps) {
  return (
    <div className="auth-field-group">
      <label htmlFor={props.id} className="auth-label">
        {label}
      </label>
      <div className="auth-input-wrapper">
        {icon && (
          <span className="auth-input-icon">
            {icon}
          </span>
        )}
        {prefix && (
          <span
            className="absolute z-10 flex items-center text-[0.9375rem] font-medium text-foreground select-none pointer-events-none"
            style={{ left: icon ? "2.5rem" : "0.875rem" }}
          >
            {prefix}
          </span>
        )}
        <input
          {...props}
          style={prefix ? { paddingLeft: icon ? "4.5rem" : "2.75rem" } : undefined}
          className={`auth-input ${error ? "auth-input-error" : ""} ${className}`}
        />
      </div>
      {error && <p className="auth-error-text">{error}</p>}
    </div>
  );
}

export function AuthPasswordInput({ label, error, className = "", ...props }: BaseInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-field-group">
      <label htmlFor={props.id} className="auth-label">
        {label}
      </label>
      <div className="auth-input-wrapper">
        <span className="auth-input-icon">
          <Lock className="h-4 w-4" />
        </span>
        <input
          {...props}
          type={showPassword ? "text" : "password"}
          className={`auth-input ${error ? "auth-input-error" : ""} ${className}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword(!showPassword)}
          className="auth-toggle-password"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {error && <p className="auth-error-text">{error}</p>}
    </div>
  );
}

export function AuthErrorBanner({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="auth-error-banner text-left">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{error}</span>
    </div>
  );
}

export function AuthSubmitButton({ 
  loading, 
  disabled, 
  children,
  loadingText = "Loading..." 
}: { 
  loading: boolean; 
  disabled?: boolean; 
  children: ReactNode;
  loadingText?: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="auth-submit-btn w-full"
    >
      {loading ? (
        <>
          <span className="auth-spinner" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
