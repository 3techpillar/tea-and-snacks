import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { ChevronLeft, User as UserIcon, Mail, Phone, Calendar, Shield, Store, CheckCircle2, XCircle } from "lucide-react";
import type { AdminUserView } from "@tea-and-snacks/shared";

export const Route = createFileRoute("/admin/users_/$userId")({
  head: () => ({ meta: [{ title: "User Profile — Admin" }] }),
  component: AdminUserProfilePage,
});

function AdminUserProfilePage() {
  const { userId } = Route.useParams();
  const query = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => adminApi.getUser(userId),
  });

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-6 w-24 animate-pulse rounded bg-secondary mb-8"></div>
        <div className="surface-card p-8 rounded-3xl animate-pulse">
          <div className="flex gap-6">
            <div className="h-24 w-24 rounded-full bg-secondary"></div>
            <div className="space-y-4 flex-1 mt-2">
              <div className="h-8 w-1/3 bg-secondary rounded"></div>
              <div className="h-4 w-1/4 bg-secondary rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">User not found</h1>
        <p className="mt-2 text-muted-foreground">The user you are looking for does not exist or has been deleted.</p>
        <Link to="/admin/users" className="mt-6 inline-flex rounded-full bg-primary px-6 py-2 font-semibold text-primary-foreground">
          Back to Users
        </Link>
      </div>
    );
  }

  const user = query.data;

  const RoleIcon = user.role === "admin" ? Shield : user.role === "vendor" ? Store : UserIcon;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link 
        to="/admin/users" 
        className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to all users
      </Link>

      <div className="surface-card rounded-3xl p-8 border border-border/50 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold shadow-sm border border-primary/20 text-4xl">
            {user.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">{user.name}</h1>
                <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" /> {user.email}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-bold capitalize">
                  <RoleIcon className="h-4 w-4" />
                  {user.role}
                </span>
                {user.isVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/10 px-3 py-1 text-sm font-bold text-mint-ink border border-mint/20">
                    <CheckCircle2 className="h-4 w-4" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-bold text-muted-foreground border border-border">
                    <XCircle className="h-4 w-4" /> Pending
                  </span>
                )}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-wider text-xs">
                  <UserIcon className="h-4 w-4" /> User ID
                </p>
                <p className="font-mono text-sm bg-secondary/50 p-2 rounded-lg border border-border break-all">{user.id}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-wider text-xs">
                  <Phone className="h-4 w-4" /> Phone Number
                </p>
                <p className="font-medium bg-secondary/50 p-2 rounded-lg border border-border">{user.phone || "No phone number provided"}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-wider text-xs">
                  <Calendar className="h-4 w-4" /> Joined Date
                </p>
                <p className="font-medium bg-secondary/50 p-2 rounded-lg border border-border">
                  {new Date(user.createdAt).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              
              {user.vendorId && (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-wider text-xs">
                    <Store className="h-4 w-4" /> Associated Vendor
                  </p>
                  <p className="font-mono text-sm bg-secondary/50 p-2 rounded-lg border border-border">
                    <Link to="/admin/vendors/$vendorId" params={{ vendorId: user.vendorId }} className="text-primary hover:underline">
                      {user.vendorId}
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
