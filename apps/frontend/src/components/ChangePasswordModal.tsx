import * as Dialog from "@radix-ui/react-dialog";
import { X, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-client";

function PasswordInput({
  label,
  value,
  onChange,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  
  return (
    <div className="auth-field-group relative">
      <label className="auth-label">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="auth-input pr-10"
          required={required}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export function ChangePasswordModal() {
  const [open, setOpen] = useState(false);
  const { changePassword } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({ oldPassword, newPassword });
      setSuccess("Password changed successfully!");
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to change password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) reset();
      }}
    >
      <Dialog.Trigger asChild>
        <button className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Update Password
        </button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[calc(100%-2rem)] max-w-[400px] translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border bg-background p-6 shadow-2xl duration-500 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-90 data-[state=open]:zoom-in-90 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[50%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[50%]">
          
          <div className="mb-6 flex flex-col space-y-1.5 text-center sm:text-left">
            <Dialog.Title className="text-xl font-bold leading-none tracking-tight">
              Change Password
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mt-2">
              Enter your current password and choose a new one.
            </Dialog.Description>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              label="Current Password"
              value={oldPassword}
              onChange={setOldPassword}
            />
            <PasswordInput
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
            />
            <PasswordInput
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />

            {error && (
              <div className="auth-error-banner mt-2">
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
            
            {success && (
              <div className="mt-2 rounded-lg bg-mint/10 p-3 text-mint border border-mint/20 flex items-center justify-center">
                <span className="text-sm font-medium">{success}</span>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-full px-5 py-2 text-sm font-semibold transition-colors hover:bg-secondary text-foreground"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSubmitting || !oldPassword || !newPassword || !confirmPassword}
                className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-pop)] transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {isSubmitting ? "Saving..." : "Save Password"}
              </button>
            </div>
          </form>

          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none">
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
