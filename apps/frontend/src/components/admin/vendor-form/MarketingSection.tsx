import { Upload } from "lucide-react";
import type { Vendor } from "@tea-and-snacks/shared";

type Props = {
  formData: Partial<Vendor>;
  setFormData: (data: Partial<Vendor>) => void;
  highlightsText: string;
  setHighlightsText: (v: string) => void;
  preview: string;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  initialData?: Partial<Vendor>;
};

export function MarketingSection({ 
  formData, setFormData, 
  highlightsText, setHighlightsText, 
  preview, handleFileChange, 
  initialData 
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Marketing & Display</h2>
        <p className="text-sm text-muted-foreground">How the stall appears to customers.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Tagline</label>
        <input 
          required 
          value={formData.tagline || ""} 
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
            value={formData.specialty || ""} 
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
  );
}
