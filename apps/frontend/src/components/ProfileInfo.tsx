import { useState } from "react";
import { useAuth } from "@/lib/auth-client";
import { ProfileHeader } from "./profile/ProfileHeader";
import { ProfileView } from "./profile/ProfileView";
import { ProfileForm } from "./profile/ProfileForm";

export function ProfileInfo() {
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState("");

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <ProfileHeader user={user} />

      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <div>
            <h3 className="text-base font-medium">Personal Information</h3>
            <p className="text-sm text-muted-foreground">Manage your personal details & delivery address</p>
          </div>
          <button
            onClick={() => {
              setIsEditing(!isEditing);
              setUpdateSuccess("");
            }}
            className="rounded-md border border-input bg-background px-4 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        <div className="p-6">
          {isEditing ? (
            <ProfileForm 
              user={user} 
              onSuccess={(msg) => {
                setUpdateSuccess(msg);
                setTimeout(() => setUpdateSuccess(""), 3000);
                setIsEditing(false);
              }} 
            />
          ) : (
            <ProfileView user={user} />
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
