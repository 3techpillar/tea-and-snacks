import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { VendorForm } from "@/components/admin/VendorForm";

export const Route = createFileRoute("/admin/vendors/$vendorId")({
  component: EditVendorPage,
});

function EditVendorPage() {
  const { vendorId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["admin-vendors-all"],
    queryFn: () => adminApi.getVendors(1, 1000),
  });

  const vendor = response?.data?.find(v => (v.id || (v as any)._id) === vendorId);

  const handleSubmit = async (data: any, file: File | null) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = vendor?.imageUrl || "";
      if (file) {
        const formDataUpload = new FormData();
        formDataUpload.append("image", file);
        const API_BASE = import.meta.env.VITE_API_URL ?? "";
        const res = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          body: formDataUpload,
          credentials: "include"
        });
        if (!res.ok) throw new Error("Image upload failed");
        const json = await res.json();
        imageUrl = json.data?.imageUrl || json.imageUrl;
      }

      await adminApi.updateVendor(vendorId, {
        ...data,
        imageUrl
      });
      
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      
      navigate({ to: "/admin/vendors" });
    } catch (err: any) {
      setError(err.message || "Failed to update vendor");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse p-8 text-center text-muted-foreground">Loading stall details...</div>;
  }

  if (!vendor) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-bold">Stall not found</h2>
        <Link to="/admin/vendors" className="mt-4 inline-block text-primary hover:underline">Back to vendors</Link>
      </div>
    );
  }

  return (
    <div className="pb-12 pt-4">
      <div className="mb-8 flex items-center gap-4">
        <Link 
          to="/admin/vendors"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-muted-foreground transition-colors hover:bg-accent/80 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Stall: {vendor.name}</h1>
          <p className="text-sm text-muted-foreground">Update details and settings for this vendor.</p>
        </div>
      </div>

      <VendorForm 
        initialData={vendor}
        onSubmit={handleSubmit} 
        isSubmitting={isSubmitting} 
        error={error} 
        submitLabel="Save Changes" 
      />
    </div>
  );
}
