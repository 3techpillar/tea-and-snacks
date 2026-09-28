import { useState, useEffect } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { Search, User, Shield, Store, ChevronLeft, ChevronRight, MoreHorizontal, Mail, ExternalLink, Ban } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

      <section className="surface-card mt-6 border border-border/50 shadow-sm overflow-hidden rounded-2xl bg-card">
        <Table className="whitespace-nowrap">
          <TableHeader className="bg-secondary/20">
            <TableRow>
              <TableHead className="px-6 py-4 uppercase tracking-wider text-xs">User Details</TableHead>
              <TableHead className="px-6 py-4 uppercase tracking-wider text-xs">Role</TableHead>
              <TableHead className="px-6 py-4 uppercase tracking-wider text-xs">Contact</TableHead>
              <TableHead className="px-6 py-4 uppercase tracking-wider text-xs">Status</TableHead>
              <TableHead className="px-6 py-4 uppercase tracking-wider text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {usersQuery.isLoading ? (
              Array.from({ length: limit }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell className="px-6 py-4"><div className="h-10 w-48 bg-secondary rounded-lg"></div></TableCell>
                  <TableCell className="px-6 py-4"><div className="h-6 w-24 bg-secondary rounded-full"></div></TableCell>
                  <TableCell className="px-6 py-4"><div className="h-4 w-32 bg-secondary rounded-md"></div></TableCell>
                  <TableCell className="px-6 py-4"><div className="h-6 w-20 bg-secondary rounded-full"></div></TableCell>
                  <TableCell className="px-6 py-4 text-right"><div className="h-8 w-8 bg-secondary rounded-full inline-block"></div></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-6 py-20 text-center hover:bg-transparent">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary/50">
                    <Search className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                  <p className="mt-4 font-bold text-lg">No users found</p>
                  <p className="text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="transition-colors hover:bg-secondary/20 group">
                  <TableCell className="px-6 py-4">
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
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold capitalize shadow-sm ${roleColors[user.role]}`}>
                      {roleIcons[user.role]}
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 font-medium text-muted-foreground text-sm">
                    {user.phone || "—"}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {user.isVerified ? (
                      <span className="inline-flex items-center rounded-full bg-mint/10 px-2.5 py-1 text-xs font-bold text-mint-ink border border-mint/20">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-mint-ink animate-pulse"></span>
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground border border-border">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>
                        Pending
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-border/50 bg-secondary/10 px-6 py-4 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">
              Showing <span className="font-bold text-foreground">{users.length > 0 ? (page - 1) * limit + 1 : 0}</span> to <span className="font-bold text-foreground">{meta ? Math.min(page * limit, meta.total) : 0}</span> of <span className="font-bold text-foreground">{meta?.total || 0}</span> users
            </p>
            <div className="h-4 w-px bg-border hidden sm:block"></div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-background border border-border/50 rounded-lg px-2 py-1 outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm font-bold text-foreground cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          
          {meta && meta.totalPages > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center justify-center rounded-xl border border-border bg-background px-3 py-1.5 transition-all hover:bg-secondary active:scale-95 disabled:opacity-50 shadow-sm font-semibold text-sm gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="flex items-center justify-center rounded-xl border border-border bg-background px-3 py-1.5 transition-all hover:bg-secondary active:scale-95 disabled:opacity-50 shadow-sm font-semibold text-sm gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
