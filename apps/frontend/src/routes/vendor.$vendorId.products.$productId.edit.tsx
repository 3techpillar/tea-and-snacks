import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ProductForm } from "@/components/vendor/MenuManagement/ProductForm";
import { useCatalog } from "@/lib/catalog-client";

export const Route = createFileRoute("/vendor/$vendorId/products/$productId/edit")({
  component: EditProductPage,
});

function EditProductPage() {
  const { vendorId, productId } = Route.useParams();
  const navigate = useNavigate();
  const { products } = useCatalog();
  
  const product = products.find((p) => p.id === productId && p.vendorId === vendorId);

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link
          to={`/vendor/${vendorId}`}
          search={{ tab: "menu" }}
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          Back to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          to={`/vendor/${vendorId}`}
          search={{ tab: "menu" }}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          ← Back to Menu
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Edit Menu Item</h1>
      </div>
      
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <ProductForm 
          vendorId={vendorId} 
          editData={product as unknown as Record<string, unknown>}
          onClose={() => navigate({ to: `/vendor/${vendorId}`, search: { tab: "menu" } })} 
        />
      </div>
    </div>
  );
}
