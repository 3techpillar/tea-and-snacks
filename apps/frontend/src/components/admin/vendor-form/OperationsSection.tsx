import { BUILDINGS, type BuildingId, type Vendor } from "@tea-and-snacks/shared";

type Props = {
  formData: Partial<Vendor>;
  setFormData: (data: Partial<Vendor>) => void;
  building: BuildingId | undefined;
  setBuilding: (v: BuildingId | undefined) => void;
  floor: string;
  setFloor: (v: string) => void;
  stallNumber: string;
  setStallNumber: (v: string) => void;
};

export function OperationsSection({
  formData, setFormData,
  building, setBuilding,
  floor, setFloor,
  stallNumber, setStallNumber
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Operations</h2>
        <p className="text-sm text-muted-foreground">Timing, location, and payment info.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Building</label>
          <select
            value={building || ""}
            onChange={e => setBuilding(e.target.value ? (e.target.value as BuildingId) : undefined)}
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select Building (Optional)</option>
            {BUILDINGS.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">Floor</label>
          <input 
            required 
            value={floor} 
            onChange={e => setFloor(e.target.value)} 
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" 
            placeholder="e.g. Ground" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">Stall Number</label>
          <input 
            required 
            value={stallNumber} 
            onChange={e => setStallNumber(e.target.value)} 
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" 
            placeholder="e.g. 104" 
          />
        </div>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Hours</label>
          <input 
            required 
            value={formData.hours || ""} 
            onChange={e => setFormData({...formData, hours: e.target.value})} 
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" 
            placeholder="9:00 AM - 9:00 PM" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">ETA</label>
          <input 
            required 
            value={formData.eta || ""} 
            onChange={e => setFormData({...formData, eta: e.target.value})} 
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" 
            placeholder="10-15 min" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">UPI ID</label>
          <input 
            required 
            value={formData.upiId || ""} 
            onChange={e => setFormData({...formData, upiId: e.target.value})} 
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" 
            placeholder="momos@easyfood" 
          />
        </div>
      </div>
    </div>
  );
}
