
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  BookIcon, 
  PenSquareIcon
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export function BottomNavigation() {
  const location = useLocation();
  const { user } = useAuth();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Only render bottom nav for logged-in users
  if (!user) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-md transition-transform duration-300 z-50 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex justify-around items-center h-16">
        <NavItem 
          to="/notes" 
          icon={<BookIcon className="h-5 w-5" />} 
          label="Notes"
          active={location.pathname.includes("/notes") || location.pathname.includes("/folder")}
        />
        <NavItem 
          to="/new" 
          icon={<PenSquareIcon className="h-5 w-5" />} 
          label="New Note"
          active={location.pathname === "/new"}
        />
      </div>
    </div>
  );
}

function NavItem({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center w-1/2 h-full transition-colors ${
        active 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
}
