import { Plus, Trash2 } from "lucide-react";
import type { ProductVariant } from "@tea-and-snacks/shared";

type VariantManagerProps = {
  hasVariants: boolean;
  variantLabel: string;
  variants: ProductVariant[];
  price: string;
  onChangeHasVariants: (val: boolean) => void;
  onChangeVariantLabel: (val: string) => void;
  onChangePrice: (val: string) => void;
  onAddVariant: () => void;
  onUpdateVariant: (index: number, field: keyof ProductVariant, val: string | number) => void;
  onRemoveVariant: (index: number) => void;
};

export function VariantManager({
  hasVariants,
  variantLabel,
  variants,
  price,
  onChangeHasVariants,
  onChangeVariantLabel,
  onChangePrice,
  onAddVariant,
  onUpdateVariant,
  onRemoveVariant,
}: VariantManagerProps) {
  return (
    <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={hasVariants}
          onChange={(e) => onChangeHasVariants(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Item has variants</span>
          <span className="text-xs text-muted-foreground">
            Enable if this item has multiple sizes (e.g. Full/Half) or types.
          </span>
        </div>
      </label>

      {!hasVariants ? (
        <div className="space-y-2">
          <label className="text-sm font-semibold">Price (₹)</label>
          <input
            required
            type="number"
            min="0"
            value={price}
            onChange={(e) => onChangePrice(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="80"
          />
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">
              Variant Category Label
            </label>
            <input
              required
              value={variantLabel}
              onChange={(e) => onChangeVariantLabel(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. Size, Type, Quantity"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold">Variants</label>
            {variants.map((variant, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  required
                  value={variant.name}
                  onChange={(e) => onUpdateVariant(idx, "name", e.target.value)}
                  className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Full Plate (10 pcs)"
                />
                <div className="relative w-24">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    ₹
                  </span>
                  <input
                    required
                    type="number"
                    min="0"
                    value={variant.price}
                    onChange={(e) => onUpdateVariant(idx, "price", Number(e.target.value))}
                    className="w-full rounded-xl border border-input bg-background pl-7 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Price"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveVariant(idx)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={onAddVariant}
              className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-xl transition-colors border border-dashed border-primary/30"
            >
              <Plus className="h-4 w-4" />
              Add Variant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
