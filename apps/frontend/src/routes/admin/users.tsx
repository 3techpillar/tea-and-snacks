import { useState, useEffect } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { Search, User, Shield, Store, MoreHorizontal, Mail, ExternalLink, Ban } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable, type ColumnDef } from "@/components/DataTable";
import type { UserRole } from "@tea-and-snacks/shared";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Manage Users — Admin" }] }),
  component: AdminUsersPage,
});

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Shield className="h-4 w-4 text-chili" />,
  vendor: <Store className="h-4 w-4 text-mango-ink" />,
  customer: <User className="h-4 w-4 text-mint-ink" />
};

const roleColors: Record<string, string> = {
  admin: "bg-chili/10 text-chili-ink border-chili/20",
  vendor: "bg-mango/10 text-mango-ink border-mango/20",
  customer: "bg-mint/10 text-mint-ink border-mint/20"
};

function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<UserRole | "All">("All");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const usersQuery = useQuery({
    queryKey: ["admin-users", page, limit, debouncedSearch, role],
    queryFn: () => adminApi.getUsers(page, limit, debouncedSearch, role),
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const { data, meta } = usersQuery.data ?? {};
  const users = data ?? [];

  const columns: ColumnDef<any>[] = [
    {
      header: "User Details",
      cell: (user) => (
        <div className="flex items-center gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold shadow-sm border border-primary/20">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" />
              {user.email}
            </p>
          </div>
        </div>
      )
    },
    {
      header: "Role",
      cell: (user) => (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold capitalize shadow-sm ${roleColors[user.role]}`}>
          {roleIcons[user.role]}
          {user.role}
        </span>
      )
    },
    {
      header: "Contact",
      cell: (user) => <span className="font-medium text-muted-foreground text-sm">{user.phone || "—"}</span>
    },
    {
      header: "Status",
      cell: (user) => (
        user.isVerified ? (
          <span className="inline-flex items-center rounded-full bg-mint/10 px-2.5 py-1 text-xs font-bold text-mint-ink border border-mint/20">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-mint-ink animate-pulse"></span>
            Verified
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground border border-border">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>
            Pending
          </span>
        )
      )
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (user) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors focus:opacity-100">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/admin/users/$userId" params={{ userId: user.id }}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => {
                if(confirm(`Are you sure you want to suspend ${user.name}?`)) {
                  alert("Suspension initiated.");
                }
              }}>
                <Ban className="mr-2 h-4 w-4" />
                Suspend User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight">Users</h1>
          <p className="mt-1 text-muted-foreground">Manage all registered accounts</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search by name or email..."
            className="w-full rounded-2xl border border-border/50 bg-secondary/30 py-3 pl-10 pr-4 text-sm font-medium outline-none transition-all focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/10 shadow-sm"
          />
        </div>
        <div className="flex gap-2 bg-secondary/30 p-1.5 rounded-2xl border border-border/50 shadow-sm overflow-x-auto no-scrollbar">
          {["All", "customer", "vendor", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r as any); setPage(1); }}
              className={`px-4 py-1.5 rounded-xl text-sm font-bold capitalize transition-all ${
                role === r 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-6">
        <DataTable
          columns={columns}
          data={users}
          isLoading={usersQuery.isLoading}
          emptyMessage="No users found. Try adjusting your filters or search query."
          pageIndex={meta?.page}
          pageCount={meta?.totalPages}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </section>
    </div>
  );
}
