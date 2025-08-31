import React from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ContextBannerProps {
  context?: string;
  contextEnabled: boolean;
  onToggleContext: (enabled: boolean) => void;
  className?: string;
}

export const ContextBanner: React.FC<ContextBannerProps> = ({
  context,
  contextEnabled,
  onToggleContext,
  className
}) => {
  if (!context && contextEnabled) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center gap-2 p-3 bg-muted/50 border-b text-sm",
      className
    )}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground font-medium">Kontext:</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {contextEnabled 
                  ? "Buddy kann sehen, wo du dich in der App befindest und relevante Hilfe anbieten."
                  : "Kontext ist deaktiviert. Buddy sieht nicht, wo du dich befindest."
                }
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {contextEnabled && context ? (
          <Badge 
            variant="secondary" 
            className="truncate max-w-[200px] sm:max-w-[300px]"
            title={context}
          >
            {context}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Deaktiviert
          </Badge>
        )}
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleContext(!contextEnabled)}
              className={cn(
                "h-8 px-2 flex-shrink-0",
                contextEnabled 
                  ? "text-green-600 hover:text-green-700 hover:bg-green-50" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {contextEnabled ? (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Ein</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Aus</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {contextEnabled 
                ? "Kontext deaktivieren - Buddy sieht nicht mehr, wo du dich befindest"
                : "Kontext aktivieren - Buddy kann relevante Hilfe basierend auf deiner aktuellen Seite anbieten"
              }
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ContextBanner;