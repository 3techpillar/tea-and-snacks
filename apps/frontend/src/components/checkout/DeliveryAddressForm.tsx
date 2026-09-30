import { BUILDINGS } from "@tea-and-snacks/shared";
import type { BuildingId } from "@tea-and-snacks/shared";

type DeliveryAddressFormProps = {
  building: BuildingId;
  setBuilding: (val: BuildingId) => void;
  floor: string;
  setFloor: (val: string) => void;
  officeNumber: string;
  setOfficeNumber: (val: string) => void;
  recipientName: string;
  setRecipientName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
};

export function DeliveryAddressForm({
  building,
  setBuilding,
  floor,
  setFloor,
  officeNumber,
  setOfficeNumber,
  recipientName,
  setRecipientName,
  phone,
  setPhone,
}: DeliveryAddressFormProps) {
  return (
    <>
      {/* ── Delivery Address ────────────────────────────── */}
      <div>
        <p className="text-sm font-semibold">📍 Delivery Address</p>
      </div>

      <div>
        <label htmlFor="building" className="text-sm font-semibold">
          Building
        </label>
        <select
          id="building"
          value={building}
          onChange={(e) => setBuilding(e.target.value as BuildingId)}
          className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
        >
          {BUILDINGS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="floor" className="text-sm font-semibold">
            Floor
          </label>
          <input
            id="floor"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            placeholder="e.g. 3, G, B1"
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="officeNumber" className="text-sm font-semibold">
            Office No.
          </label>
          <input
            id="officeNumber"
            value={officeNumber}
            onChange={(e) => setOfficeNumber(e.target.value)}
            placeholder="e.g. 304, A-12"
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* ── Recipient Details ───────────────────────────── */}
      <div>
        <p className="mt-4 text-sm font-semibold">👤 Recipient Details</p>
      </div>

      <div>
        <label htmlFor="recipientName" className="text-sm font-semibold">
          Name
        </label>
        <input
          id="recipientName"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          placeholder="Recipient name"
          className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="phone" className="text-sm font-semibold">
          Phone
        </label>
        <input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="98765 43210"
          className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </>
  );
}
