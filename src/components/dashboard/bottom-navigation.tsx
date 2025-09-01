import { Button } from "@/components/ui/button";
import { 
  Home, 
  BookOpen, 
  FileText, 
  Calendar, 
  BarChart3, 
  User 
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface BottomNavigationProps {
  t: any;
}

export function BottomNavigation({ t }: BottomNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: t.dashboard, path: "/", onClick: () => navigate("/") },
    { icon: BookOpen, label: t.subjects, path: "/subjects", onClick: () => navigate("/subjects") },
    { icon: FileText, label: t.notes, path: "/notes", onClick: () => navigate("/notes") },
    { icon: Calendar, label: t.calendar, path: "/calendar", onClick: () => navigate("/calendar") },
    { icon: BarChart3, label: t.analysis, path: "/analysis", onClick: () => navigate("/analysis") },
    { icon: User, label: t.profile, path: "/profile", onClick: () => navigate("/profile") },
  ];

  return (
    <>
      {/* Spacer to prevent content from being overlapped by the fixed bottom nav */}
      <div aria-hidden className="h-16 md:h-20" />

      {/* Fixed bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border h-16 md:h-20"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="container mx-auto px-2 md:px-4 h-full">
          <div className="flex h-full items-center justify-around py-1.5 md:py-2">
            {navItems.map((item, index) => (
              <Button
                key={index}
                aria-label={item.label}
                variant="ghost"
                size="sm"
                className={`${
                  location.pathname === item.path
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground"
                } 
                // Mobile: icon-only circular buttons
                h-10 w-10 rounded-full p-0 justify-center
                // Desktop: stacked icon + label like earlier
                md:h-auto md:w-auto md:rounded-none md:px-2 md:py-3 md:flex md:flex-col md:items-center md:gap-1 md:text-xs`}
                onClick={item.onClick}
              >
                <item.icon className="h-5 w-5 md:h-4 md:w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}