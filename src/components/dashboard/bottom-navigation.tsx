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
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 px-2 py-3 h-auto text-xs ${
                location.pathname === item.path
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={item.onClick}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}