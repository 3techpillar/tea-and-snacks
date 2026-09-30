import type { Vendor } from "@tea-and-snacks/shared";

type Props = {
  formData: Partial<Vendor>;
  setFormData: (data: Partial<Vendor>) => void;
  isNew: boolean;
};

export function StallIdentitySection({ formData, setFormData, isNew }: Props) {
  return (
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
            value={formData.name || ""} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" 
            placeholder="e.g. Magic Momos" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Stall ID (Slug)</label>
          <input 
            required 
            disabled={!isNew}
            value={formData.id || ""} 
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
            value={formData.cuisine || ""} 
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
              value={formData.emoji || ""} 
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
            value={formData.accent || "mango"} 
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
  );
}
