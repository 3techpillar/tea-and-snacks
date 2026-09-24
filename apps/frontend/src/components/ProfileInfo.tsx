import { useState } from "react";
import { useAuth } from "@/lib/auth-client";
import { User, Mail, Phone, Tag } from "lucide-react";

export function ProfileInfo() {
  const { user, updateProfile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError("");
    setUpdateSuccess("");
    setIsSaving(true);
    try {
      await updateProfile({ name: editName, phone: editPhone });
      setUpdateSuccess("Profile updated successfully!");
      setTimeout(() => setUpdateSuccess(""), 3000);
      setIsEditing(false);
    } catch (err: any) {
      setUpdateError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar Section */}
      <div className="flex items-center gap-6 rounded-xl border border-border bg-background p-6 shadow-sm">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary text-2xl font-semibold text-primary-foreground shadow-sm ring-4 ring-background">
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-medium text-foreground">{user.name}</h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <div>
            <h3 className="text-base font-medium">Personal Information</h3>
            <p className="text-sm text-muted-foreground">Manage your personal details</p>
          </div>
          <button
            onClick={() => {
              setIsEditing(!isEditing);
              setEditName(user.name);
              setEditPhone(user.phone || "");
              setUpdateError("");
              setUpdateSuccess("");
            }}
            className="rounded-md border border-input bg-background px-4 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Add a phone number"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              
              {updateError && <p className="text-sm font-medium text-destructive">{updateError}</p>}
              
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <dl className="grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" /> Full Name</dt>
                <dd className="mt-1 text-sm font-medium">{user.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4" /> Email Address</dt>
                <dd className="mt-1 text-sm font-medium">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4" /> Phone Number</dt>
                <dd className="mt-1 text-sm font-medium">{user.phone || <span className="text-muted-foreground italic">Not provided</span>}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Tag className="h-4 w-4" /> Account Role</dt>
                <dd className="mt-1 text-sm font-medium capitalize inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">{user.role}</dd>
              </div>
            </dl>
          )}

          {updateSuccess && !isEditing && (
            <div className="mt-6 rounded-md bg-mint/10 p-3 text-mint border border-mint/20 flex items-center">
              <span className="text-sm font-medium">{updateSuccess}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
