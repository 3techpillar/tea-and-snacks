import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Upload, Loader2 } from "lucide-react";
import { vendorApi } from "@/lib/api/vendor";

export function ProductFormModal({
  vendorId,
  editData,
  onClose,
}: {
  vendorId: string;
  editData?: Record<string, unknown> | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!editData;

  const [formData, setFormData] = useState({
    id: (editData?.id as string) || (editData?._id as string) || "",
    name: (editData?.name as string) || "",
    price: editData?.price != null ? String(editData.price) : "",
    emoji: (editData?.emoji as string) || "🍲",
    veg: (editData?.veg as boolean) ?? true,
    tag: (editData?.tag as string) || "",
    isAvailable: (editData?.isAvailable as boolean) ?? true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>((editData?.imageUrl as string) || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      ...(!isEdit
        ? {
            id: name
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/-+$/, ""),
          }
        : {}),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      let imageUrl = (editData?.imageUrl as string) || "";
      if (file) {
        const formDataUpload = new FormData();
        formDataUpload.append("image", file);
        const API_BASE = import.meta.env.VITE_API_URL ?? "";
        const res = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          body: formDataUpload,
          credentials: "include",
        });
        if (!res.ok) throw new Error("Image upload failed");
        const json = await res.json();
        imageUrl = json.data?.imageUrl || json.imageUrl;
      }

      const payload = {
        ...formData,
        price: Number(formData.price),
        imageUrl,
      };

      if (isEdit) {
        const productId = (editData.id as string) || (editData._id as string);
        await vendorApi.updateProduct(vendorId, productId, payload);
      } else {
        await vendorApi.createProduct(vendorId, payload);
      }

      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : `Failed to ${isEdit ? "update" : "create"} product`,
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-xl border border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{isEdit ? "Edit Menu Item" : "Add Menu Item"}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isEdit
                ? "Update the details for this item."
                : "Add a new item to your stall's menu."}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Item Name</label>
              <input
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Veg Momos"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Item ID (Slug)</label>
              <input
                required
                disabled={isEdit}
                value={formData.id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    id: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  })
                }
                className="w-full rounded-xl border border-input bg-muted px-4 py-2.5 text-sm transition-colors focus:outline-none disabled:opacity-70"
                placeholder="auto-generated"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Price (₹)</label>
              <input
                required
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="80"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Emoji</label>
              <div className="relative">
                <input
                  required
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-xl transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="🥟"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Dietary</label>
              <select
                value={formData.veg ? "veg" : "non-veg"}
                onChange={(e) => setFormData({ ...formData, veg: e.target.value === "veg" })}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="veg">Veg</option>
                <option value="non-veg">Non-Veg</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Tag <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <input
              value={formData.tag}
              onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. Bestseller, New, Spicy"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Item Image{" "}
              <span className="text-muted-foreground font-normal">
                ({isEdit ? "Optional" : "Recommended"})
              </span>
            </label>
            <div className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border transition-colors hover:bg-accent/30">
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-40 w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-sm font-semibold text-white">Change Image</span>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent text-muted-foreground">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-medium">Click to upload image</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">JPG, PNG or WEBP</p>
                </div>
              )}
              <input
                type="file"
                className="absolute inset-0 cursor-pointer opacity-0"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? isEdit
                  ? "Saving..."
                  : "Adding..."
                : isEdit
                  ? "Save Changes"
                  : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
