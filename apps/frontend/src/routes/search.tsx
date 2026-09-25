import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { VendorCard } from "@/components/VendorCard";
import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "@/lib/api/catalog";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Search food & vendors — Easy Food" },
      {
        name: "description",
        content:
          "Search the food court for tea, snacks, biryani, desserts and more.",
      },
      { property: "og:title", content: "Search food & vendors — Easy Food" },
      {
        property: "og:description",
        content: "Find any dish or counter in the food court in one tap.",
      },
    ],
  }),
  component: SearchPage,
});


function SearchPage() {
  const { q } = Route.useSearch();
  
  const searchQuery = useQuery({
    queryKey: ["search", q],
    queryFn: () => catalogApi.searchCatalog(q),
    enabled: q.trim().length > 0,
  });

  const results = searchQuery.data ?? [];
  const isLoading = searchQuery.isFetching;

  const dishes = results.flatMap((r) =>
    r.kind === "product" ? [r.product] : [],
  );
  const counters = results.flatMap((r) =>
    r.kind === "vendor" ? [r.vendor] : [],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Search</h1>
      <div className="mt-3">
        <SearchBar initialQuery={q} autoFocus />
      </div>

      {q.trim() === "" ? (
        <p className="mt-6 text-muted-foreground">
          Type something tasty to get started.
        </p>
      ) : results.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-4xl">🍽️</p>
          <p className="mt-3 font-semibold">No results for “{q}”</p>
          <Link
            to="/vendors"
            className="mt-4 inline-flex text-sm font-semibold text-primary"
          >
            Browse all vendors →
          </Link>
        </div>
      ) : (
        <>
          {dishes.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold">
                Dishes ({dishes.length})
              </h2>
              <div className="mt-3 grid gap-3">
                {dishes.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
          {counters.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">
                Vendors ({counters.length})
              </h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {counters.map((v) => (
                  <VendorCard key={v.id} vendor={v} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
