import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { type BuildingId, type Vendor } from "@tea-and-snacks/shared";

import { StallIdentitySection } from "./vendor-form/StallIdentitySection";
import { AccountDetailsSection } from "./vendor-form/AccountDetailsSection";
import { OperationsSection } from "./vendor-form/OperationsSection";
import { MarketingSection } from "./vendor-form/MarketingSection";

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
    accent: "mango", tagline: "", hours: "9:00 AM - 9:00 PM",
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
  const [building, setBuilding] = useState<BuildingId | undefined>(initialData?.location?.building);
  const [floor, setFloor] = useState(initialData?.location?.floor || "");
  const [stallNumber, setStallNumber] = useState(initialData?.location?.stallNumber || "");

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
      location: { building, floor, stallNumber } as any,
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

      <StallIdentitySection 
        formData={formData} 
        setFormData={setFormData} 
        isNew={!initialData?.id} 
      />

      <div className="h-px bg-border" />

      {/* Account Details (Only on Creation) */}
      {!initialData?.id && (
        <>
          <AccountDetailsSection 
            ownerEmail={ownerEmail}
            setOwnerEmail={setOwnerEmail}
            ownerMobile={ownerMobile}
            setOwnerMobile={setOwnerMobile}
          />
          <div className="h-px bg-border" />
        </>
      )}

      <OperationsSection 
        formData={formData}
        setFormData={setFormData}
        building={building}
        setBuilding={setBuilding}
        floor={floor}
        setFloor={setFloor}
        stallNumber={stallNumber}
        setStallNumber={setStallNumber}
      />

      <div className="h-px bg-border" />

      <MarketingSection 
        formData={formData}
        setFormData={setFormData}
        highlightsText={highlightsText}
        setHighlightsText={setHighlightsText}
        preview={preview}
        handleFileChange={handleFileChange}
        initialData={initialData}
      />

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
