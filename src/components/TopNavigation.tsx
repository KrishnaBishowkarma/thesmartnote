
import { Link, useLocation } from "react-router-dom";
import { HomeIcon, PhoneIcon, UserIcon } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

export function TopNavigation() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 left-0 right-0 bg-background border-b border-border shadow-sm z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-1">
            <Link to="/" className="font-bold text-xl text-primary">
              SmartNote
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <NavItem
              to="/"
              icon={<HomeIcon className="h-4 w-4" />}
              label="Home"
              active={location.pathname === "/"}
            />
            <NavItem
              to="/contact"
              icon={<PhoneIcon className="h-4 w-4" />}
              label="Contact"
              active={location.pathname === "/contact"}
            />
            <NavItem
              to="/auth"
              icon={<UserIcon className="h-4 w-4" />}
              label={user ? "Account" : "Sign In"}
              active={location.pathname === "/auth"}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavItem({ to, icon, label, active }) {
  return (
    <Button
      asChild
      variant={active ? "default" : "ghost"}
      size="sm"
      className="flex items-center gap-1"
    >
      <Link to={to}>
        {icon}
        <span>{label}</span>
      </Link>
    </Button>
  );
}
