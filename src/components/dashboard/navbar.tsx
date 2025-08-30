import { Button } from "@/components/ui/button";
import { Globe, Bell, Settings, LogOut, User, ChevronDown, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useProfile, useParentProfile } from "@/hooks/use-profile";
import { useParentContext } from "@/contexts/parent-context";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const { data: parentProfile } = useParentProfile();
  const { isParentMode, selectedChild, children, selectChild, addChild } = useParentContext();
  const [showAddChild, setShowAddChild] = useState(false);
  const [childEmail, setChildEmail] = useState("");
  const [isAddingChild, setIsAddingChild] = useState(false);

  // Always show parent's profile in navbar, not child's
  const displayProfile = parentProfile || profile;
  const displayName = displayProfile?.display_name || user?.email?.split("@")[0] || "User";
  const gradeLabel = displayProfile?.account_type === 'parent' ? "Parent" : 
    displayProfile?.grade_level ? `Klasse ${displayProfile.grade_level}` : "Student";
    
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleAddChild = async () => {
    if (!childEmail.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsAddingChild(true);
    try {
      await addChild(childEmail.trim());
      setChildEmail("");
      setShowAddChild(false);
      toast.success("Child added successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add child");
    } finally {
      setIsAddingChild(false);
    }
  };

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
            {/* Child Selection Dropdown for Parents */}
            {parentProfile?.account_type === 'parent' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">
                       {selectedChild ? `${selectedChild.child_display_name || selectedChild.child_email?.split('@')[0]} (ID: ${selectedChild.child_id.slice(0,8)})` : 'Select Child'}
                     </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {children.map((child) => (
                     <DropdownMenuItem
                       key={child.child_id}
                       onClick={() => selectChild(child.child_id)}
                       className={selectedChild?.child_id === child.child_id ? "bg-accent" : ""}
                     >
                       <div className="flex flex-col">
                         <span className="font-medium">
                           {child.child_display_name || child.child_email?.split('@')[0]}
                         </span>
                         <span className="text-xs text-muted-foreground">
                           {child.child_grade_level ? `Klasse ${child.child_grade_level}` : child.child_email}
                         </span>
                       </div>
                     </DropdownMenuItem>
                   ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowAddChild(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Child
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
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
                    <AvatarImage src={displayProfile?.avatar_url ?? undefined} alt={displayName} />
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
      
      {/* Add Child Dialog */}
      <Dialog open={showAddChild} onOpenChange={setShowAddChild}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Child</DialogTitle>
            <DialogDescription>
              Enter your child's email address to link their account to yours.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="child@example.com"
                value={childEmail}
                onChange={(e) => setChildEmail(e.target.value)}
                className="col-span-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddChild();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddChild(false);
                setChildEmail("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddChild}
              disabled={isAddingChild || !childEmail.trim()}
            >
              {isAddingChild ? "Adding..." : "Add Child"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
};