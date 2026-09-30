import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card pb-20 pt-8 sm:pb-8">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <div className="mb-4 flex flex-wrap justify-center gap-4 text-sm font-medium text-muted-foreground sm:gap-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <Link to="/vendors" className="hover:text-foreground">Vendors</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms & Conditions</Link>
        </div>
        <p className="text-xs text-muted-foreground/70">
          &copy; {new Date().getFullYear()} Tea & Snacks. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
