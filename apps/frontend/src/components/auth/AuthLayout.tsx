import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function AuthHero() {
  return (
    <div className="hidden lg:block lg:w-1/2 bg-zinc-900 relative h-full">
      <Link 
        to="/" 
        className="absolute top-8 left-8 z-10 flex items-center gap-2 rounded-full bg-black/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/40"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
      <img 
        src="/auth-hero.jpg" 
        alt="Delicious Indian tea and snacks" 
        className="absolute inset-0 w-full h-full object-cover opacity-85" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute bottom-16 left-12 text-white max-w-lg">
        <h1 className="text-5xl font-bold mb-4 font-display">Craving authentic flavors?</h1>
        <p className="text-xl text-white/90">
          Order the best street food and cutting chai, delivered fresh to your door in minutes.
        </p>
      </div>
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full">
      <AuthHero />
      <div className="relative w-full lg:w-1/2 h-full overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
        <div className="flex min-h-full items-center justify-center px-4 py-12 sm:py-24 sm:px-12">
          <div className="mx-auto w-full max-w-md bg-background border border-border rounded-xl shadow-sm p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
