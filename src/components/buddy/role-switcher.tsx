import React from 'react';
import { GraduationCap, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Role = 'student' | 'parent' | 'teacher';

interface RoleSwitcherProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  className?: string;
}

const roleConfig = {
  student: {
    label: 'Schüler',
    icon: GraduationCap,
    color: 'bg-blue-500 hover:bg-blue-600',
    description: 'Lernhilfe & Studientipps'
  },
  parent: {
    label: 'Elternteil',
    icon: Users,
    color: 'bg-green-500 hover:bg-green-600',
    description: 'Beratung & Übersichten'
  },
  teacher: {
    label: 'Lehrer',
    icon: BookOpen,
    color: 'bg-purple-500 hover:bg-purple-600',
    description: 'Bewertung & Workflows'
  }
};

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  onRoleChange,
  className
}) => {
  const currentConfig = roleConfig[currentRole];
  const CurrentIcon = currentConfig.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1 h-8 px-2 min-w-0 flex-shrink-0",
            className
          )}
        >
          <CurrentIcon className="h-4 w-4 flex-shrink-0" />
          <span className="hidden md:inline text-sm truncate">{currentConfig.label}</span>
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs px-1 py-0.5 text-white border-0 flex-shrink-0",
              currentConfig.color
            )}
          >
            {currentRole.charAt(0).toUpperCase()}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        {Object.entries(roleConfig).map(([role, config]) => {
          const Icon = config.icon;
          const isSelected = role === currentRole;
          
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => onRoleChange(role as Role)}
              className={cn(
                "flex items-center gap-3 p-3 cursor-pointer",
                isSelected && "bg-muted"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-white",
                config.color
              )}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{config.label}</span>
                  {isSelected && (
                    <Badge variant="secondary" className="text-xs">
                      Aktiv
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {config.description}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RoleSwitcher;