type Props = {
  ownerEmail: string;
  setOwnerEmail: (v: string) => void;
  ownerMobile: string;
  setOwnerMobile: (v: string) => void;
};

export function AccountDetailsSection({ ownerEmail, setOwnerEmail, ownerMobile, setOwnerMobile }: Props) {
  return (
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
  );
}
