import { useState } from "react";
import { Pencil } from "lucide-react";

export function InlinePrice({
  price,
  onSave,
  isSaving,
}: {
  price: number;
  onSave: (p: number) => void;
  isSaving: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(String(price));

  const handleSave = () => {
    const num = Number(draft);
    if (!isNaN(num) && num >= 0 && num !== price) {
      onSave(num);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">₹</span>
        <input
          autoFocus
          type="number"
          min="0"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setIsEditing(false);
          }}
          className="w-16 rounded-md border border-primary bg-background px-1.5 py-0.5 text-sm font-semibold outline-none"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(String(price));
        setIsEditing(true);
      }}
      disabled={isSaving}
      className="group/price flex items-center gap-1 text-sm font-semibold text-foreground transition-colors hover:text-primary"
      title="Click to edit price"
    >
      ₹{price}
      <Pencil className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover/price:opacity-60" />
    </button>
  );
}
