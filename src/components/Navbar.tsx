import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Search, Bell, User, LogOut, LogIn, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { to: "/", label: "Home", icon: null, requiresAuth: false },
  { to: "/exams", label: "Exams", icon: Search, requiresAuth: false },
  { to: "/notifications", label: "Alerts", icon: Bell, requiresAuth: false },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, requiresAuth: true },
  { to: "/profile", label: "Profile", icon: User, requiresAuth: true },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-lg">E</span>
            </div>
            <span className="hidden sm:inline font-display text-lg font-bold text-foreground">
              exam<span className="text-primary">intel</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = item.to === "/" 
                ? location.pathname === "/" 
                : location.pathname.startsWith(item.to);
              const isLocked = item.requiresAuth && !user;

              if (isLocked) return null;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link to="/admin">
                    <Button size="sm" variant="outline" className="rounded-lg text-xs h-9 font-semibold border-primary/30 text-primary hover:bg-primary/10">
                      <Shield className="w-3.5 h-3.5 mr-1.5" /> Admin
                    </Button>
                  </Link>
                )}
                <span className="hidden lg:inline text-sm text-muted-foreground truncate max-w-[140px]">{user.email}</span>
                <button
                  onClick={() => { signOut(); navigate("/"); }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="rounded-lg h-9 text-sm font-semibold border-border hover:bg-secondary">
                    Login
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="rounded-lg h-9 text-sm font-semibold">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
