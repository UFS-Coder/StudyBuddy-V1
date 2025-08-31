import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ChatDrawer } from './chat-drawer';

interface FloatingWidgetProps {
  disabled?: boolean;
  className?: string;
}

export const FloatingWidget: React.FC<FloatingWidgetProps> = ({ 
  disabled = false, 
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (disabled) {
    return null;
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleToggle}
              size="lg"
              className={cn(
                "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
                "bg-primary hover:bg-primary/90 text-primary-foreground",
                "transition-all duration-200 hover:scale-110",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isOpen && "bg-destructive hover:bg-destructive/90",
                className
              )}
              aria-label={isOpen ? "Buddy Chat schließen" : "Buddy Chat öffnen"}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <MessageCircle className="h-6 w-6" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="mb-2">
            <p>{isOpen ? "Buddy Chat schließen" : "Ask Buddy"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ChatDrawer 
        isOpen={isOpen} 
        onClose={handleClose}
      />
    </>
  );
};

export default FloatingWidget;