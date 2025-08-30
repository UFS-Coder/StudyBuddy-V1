import { Button } from "@/components/ui/button";
import { Globe, Bell, Settings, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";

interface NavbarProps {
  language: 'de' | 'en';
  onLanguageChange: (lang: 'de' | 'en') => void;
  studentName: string;
  t: any;
}

export const Navbar = ({ language, onLanguageChange, studentName, t }: NavbarProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfile();

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Student";
  const gradeLabel = profile?.grade_level ? `Grade ${profile.grade_level}` : "Schüler";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav className="bg-background border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              aria-label="Go to home page"
            >
              <img src="/studybuddy-logo.svg" alt="StudyBuddy Logo" className="w-8 h-8 rounded-md" />
              <div className="flex flex-col">
                <span className="text-xl font-semibold tracking-tight">StudyBuddy</span>
                <span className="text-xs text-muted-foreground -mt-0.5 hidden sm:block">Schüler-Notenportal</span>
              </div>
            </button>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" aria-label="Benachrichtigungen" className="rounded-full">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="sm" aria-label="Einstellungen" className="rounded-xl">
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLanguageChange(language === 'de' ? 'en' : 'de')}
              className="hidden md:inline-flex items-center gap-2"
              aria-label="Sprache umschalten"
            >
              <Globe className="h-4 w-4" />
              {language === 'de' ? 'EN' : 'DE'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg hover:bg-accent px-2 py-1 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url ?? undefined} alt={displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-sm font-medium">{displayName}</span>
                    <span className="text-xs text-muted-foreground">{gradeLabel}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user?.email && (
                  <DropdownMenuItem className="text-sm font-medium">
                    {user.email}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate("/profile")}> 
                  <User className="mr-2 h-4 w-4" />
                  Profile & Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};