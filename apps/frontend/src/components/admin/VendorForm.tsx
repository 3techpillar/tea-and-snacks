import { useState, useEffect } from "react";
import { Upload, Store, Loader2, Save } from "lucide-react";
import type { Vendor } from "@tea-and-snacks/shared";

type VendorFormProps = {
  initialData?: Partial<Vendor>;
  onSubmit: (data: any, file: File | null) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
  submitLabel: string;
};

export function VendorForm({ initialData, onSubmit, isSubmitting, error, submitLabel }: VendorFormProps) {
  const [formData, setFormData] = useState<Partial<Vendor>>({
    id: "", name: "", cuisine: "", emoji: "🍲", rating: 5.0, eta: "10-15 min",
    accent: "mango", tagline: "", counter: "", hours: "9:00 AM - 9:00 PM",
    specialty: "", upiId: "", highlights: [],
    ...initialData,
  });
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [highlightsText, setHighlightsText] = useState(
    initialData?.highlights?.join(", ") || ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(initialData?.imageUrl || "");

  // Auto-generate ID from name only if it's a new vendor (not editing an existing ID)
  useEffect(() => {
    if (!initialData?.id && formData.name) {
      setFormData(prev => ({
        ...prev,
        id: formData.name!.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
      }));
    }
  }, [formData.name, initialData?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      highlights: highlightsText.split(",").map(s => s.trim()).filter(Boolean),
    };
    if (!initialData?.id) {
      (dataToSubmit as any).ownerEmail = ownerEmail;
      (dataToSubmit as any).ownerMobile = `+91${ownerMobile}`;
    }
    onSubmit(dataToSubmit, file);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {/* Main Details */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">Stall Identity</h2>
          <p className="text-sm text-muted-foreground">Basic information about the food stall.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Stall Name</label>
            <input 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" 
              placeholder="e.g. Magic Momos" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Stall ID (Slug)</label>
            <input 
              required 
              disabled={!!initialData?.id}
              value={formData.id} 
              onChange={e => setFormData({...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '-')})} 
              className="w-full rounded-xl border border-input bg-muted px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-70" 
              placeholder="auto-generated" 
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Cuisine</label>
            <input 
              required 
              value={formData.cuisine} 
              onChange={e => setFormData({...formData, cuisine: e.target.value})} 
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary" 
              placeholder="e.g. Chinese" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Emoji</label>
            <div className="relative">
              <input 
                required 
                value={formData.emoji} 
                onChange={e => setFormData({...formData, emoji: e.target.value})} 
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 pl-12 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary" 
                placeholder="🥟" 
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">{formData.emoji || "🥟"}</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Accent Color</label>
            <select 
              value={formData.accent} 
              onChange={e => setFormData({...formData, accent: e.target.value as any})} 
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="mango">Mango</option>
              <option value="chili">Chili</option>
              <option value="mint">Mint</option>
              <option value="berry">Berry</option>
              <option value="sky">Sky</option>
              <option value="grape">Grape</option>
            </select>
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Account Details (Only on Creation) */}
      {!initialData?.id && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold">Stall Owner Account</h2>
            <p className="text-sm text-muted-foreground">These details will be used by the stall owner to log in and manage their menu.</p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Owner Email Address</label>
              <input 
                type="email"
                required 
                value={ownerEmail} 
                onChange={e => setOwnerEmail(e.target.value)} 
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" 
                placeholder="vendor@example.com" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Owner Mobile Number</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-sm font-medium text-muted-foreground">+91</span>
                <input 
                  type="tel"
                  required 
                  value={ownerMobile} 
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    if (val.length > 0 && !/^[6-9]/.test(val)) return;
                    setOwnerMobile(val);
                  }}
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-12 pr-4 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" 
                  placeholder="9876543210"
                  pattern="^[6-9]\d{9}$"
                  title="Please enter a valid 10-digit Indian mobile number starting with 6-9"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operational Details */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">Operations</h2>
          <p className="text-sm text-muted-foreground">Timing, location, and payment info.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Counter No.</label>
            <input 
              required 
              value={formData.counter} 
              onChange={e => setFormData({...formData, counter: e.target.value})} 
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" 
              placeholder="Counter 7" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Hours</label>
            <input 
              required 
              value={formData.hours} 
              onChange={e => setFormData({...formData, hours: e.target.value})} 
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" 
              placeholder="9:00 AM - 9:00 PM" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">ETA</label>
            <input 
              required 
              value={formData.eta} 
              onChange={e => setFormData({...formData, eta: e.target.value})} 
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" 
              placeholder="10-15 min" 
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold">UPI ID</label>
          <input 
            required 
            value={formData.upiId} 
            onChange={e => setFormData({...formData, upiId: e.target.value})} 
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" 
            placeholder="momos@easyfood" 
          />
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Marketing */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">Marketing & Display</h2>
          <p className="text-sm text-muted-foreground">How the stall appears to customers.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Tagline</label>
          <input 
            required 
            value={formData.tagline} 
            onChange={e => setFormData({...formData, tagline: e.target.value})} 
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" 
            placeholder="Authentic street momos" 
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Specialty Item</label>
            <input 
              required 
              value={formData.specialty} 
              onChange={e => setFormData({...formData, specialty: e.target.value})} 
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" 
              placeholder="Steamed Momos" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Highlights</label>
            <input 
              value={highlightsText} 
              onChange={e => setHighlightsText(e.target.value)} 
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" 
              placeholder="Extra spicy chutney, Fresh daily (comma separated)" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Stall Image {initialData ? "(Optional)" : "(Required)"}</label>
          <div className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border transition-colors hover:bg-accent/30">
            {preview ? (
              <>
                <img src={preview} alt="Preview" className="h-48 w-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-sm font-semibold text-white">Change Image</span>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-muted-foreground">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-medium">Click to upload image</p>
                <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or WEBP (max 5MB)</p>
              </div>
            )}
            <input 
              type="file" 
              className="absolute inset-0 cursor-pointer opacity-0" 
              accept="image/*" 
              required={!initialData && !preview} 
              onChange={handleFileChange} 
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border pt-6">
        <button 
          type="button" 
          onClick={() => window.history.back()}
          className="rounded-full px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="flex items-center gap-2 rounded-full bg-primary px-8 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
