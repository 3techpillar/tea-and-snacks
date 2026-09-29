import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ProductForm } from "@/components/vendor/MenuManagement/ProductForm";

export const Route = createFileRoute("/vendor/$vendorId/products/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const { vendorId } = Route.useParams();
  const navigate = useNavigate();

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
        <h1 className="mt-2 text-3xl font-bold">Add Menu Item</h1>
      </div>
      
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <ProductForm 
          vendorId={vendorId} 
          onClose={() => navigate({ to: `/vendor/${vendorId}`, search: { tab: "menu" } })} 
        />
      </div>
    </div>
  );
}
