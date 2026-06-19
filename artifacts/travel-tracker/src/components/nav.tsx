import { Link, useLocation } from "wouter";
import { Globe, Clock, Map, PlusCircle, BarChart2, FlagTriangleRight, LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const links = [
  { href: "/", label: "World Map", icon: Globe },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/visits", label: "All Visits", icon: Map },
  { href: "/countries", label: "Countries", icon: FlagTriangleRight },
  { href: "/stats", label: "By Year", icon: BarChart2 },
];

export default function Nav() {
  const [location] = useLocation();
  const { isAdmin, logout } = useAuth();

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-sidebar-primary flex items-center justify-center">
            <Globe className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-semibold text-base tracking-tight text-white">SY's Travel Log</span>
        </div>
        <p className="text-xs text-sidebar-foreground/50 mt-1.5 pl-9">
          {isAdmin ? "Editing mode" : "View only"}
        </p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Admin actions */}
      <div className="px-3 pb-5 space-y-2">
        {isAdmin ? (
          <>
            <Link
              href="/visits/new"
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <PlusCircle className="w-4 h-4" />
              Log a Visit
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md border border-sidebar-border text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 text-sm transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign in to edit
          </Link>
        )}
      </div>
    </aside>
  );
}
