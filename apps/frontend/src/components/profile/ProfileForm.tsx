import { useState } from "react";
import { User, Phone, MapPin } from "lucide-react";
import { BUILDINGS, type BuildingId } from "@tea-and-snacks/shared";
import type { PublicUser } from "@tea-and-snacks/shared";
import { useAuth } from "@/lib/auth-client";

type ProfileFormProps = {
  user: PublicUser;
  onSuccess: (msg: string) => void;
};

export function ProfileForm({ user, onSuccess }: ProfileFormProps) {
  const { updateProfile } = useAuth();

  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone || "");

  const [editBuilding, setEditBuilding] = useState<BuildingId | "">(
    (user.defaultAddress?.building as BuildingId) || ""
  );
  const [editFloor, setEditFloor] = useState(user.defaultAddress?.floor || "");
  const [editOffice, setEditOffice] = useState(
    user.defaultAddress?.officeNumber || ""
  );

  const [updateError, setUpdateError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError("");
    setIsSaving(true);
    try {
      let defaultAddress = undefined;
      if (editBuilding && editFloor && editOffice) {
        defaultAddress = {
          building: editBuilding,
          floor: editFloor,
          officeNumber: editOffice,
        };
      }
      await updateProfile({ name: editName, phone: editPhone, defaultAddress });
      onSuccess("Profile updated successfully!");
    } catch (err: any) {
      setUpdateError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-md">
      <div className="space-y-4">
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
      </div>

      <div className="pt-4 border-t border-border/50 space-y-4">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" /> Default Delivery
          Address
        </h4>
        <div className="space-y-2">
          <label className="text-sm font-medium">Building</label>
          <select
            value={editBuilding}
            onChange={(e) => setEditBuilding(e.target.value as BuildingId)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>
              Select a building
            </option>
            {BUILDINGS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Floor</label>
            <input
              type="text"
              value={editFloor}
              onChange={(e) => setEditFloor(e.target.value)}
              placeholder="e.g. 3, G"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Office No.</label>
            <input
              type="text"
              value={editOffice}
              onChange={(e) => setEditOffice(e.target.value)}
              placeholder="e.g. 304"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>

      {updateError && (
        <p className="text-sm font-medium text-destructive">{updateError}</p>
      )}

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
  );
}
