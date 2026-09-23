import { createFileRoute } from "@tanstack/react-router";
import { VendorCard } from "@/components/VendorCard";
import { SearchBar } from "@/components/SearchBar";
import { useCatalog } from "@/lib/catalog-client";

export const Route = createFileRoute("/vendors/")({
  head: () => ({
    meta: [
      { title: "Vendors — Easy Food" },
      {
        name: "description",
        content:
          "All food court vendors: chai, burgers, salads, biryani, rolls and desserts.",
      },
      { property: "og:title", content: "Vendors — Easy Food" },
      {
        property: "og:description",
        content: "Pick a vendor and browse their live menu with prices.",
      },
    ],
  }),
  component: VendorsPage,
});

function VendorsPage() {
  const { vendors } = useCatalog();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Vendors</h1>
      <p className="mt-2 text-muted-foreground">
        {vendors.length} counters open right now.
      </p>
      <div className="relative z-30 mt-4">
        <SearchBar />
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v) => (
          <VendorCard key={v.id} vendor={v} />
        ))}
      </div>
    </div>
  );
}
