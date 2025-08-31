import React from 'react';
import { Clock, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export interface ChatThread {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface ChatHistoryProps {
  threads: ChatThread[];
  currentThreadId?: string;
  onSelectThread: (threadId: string) => void;
  onNewChat: () => void;
  onDeleteThread: (threadId: string) => void;
  className?: string;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  threads,
  currentThreadId,
  onSelectThread,
  onNewChat,
  onDeleteThread,
  className
}) => {
  const formatTimestamp = (date: Date) => {
    try {
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: de 
      });
    } catch {
      return 'vor einiger Zeit';
    }
  };

  const truncateTitle = (title: string, maxLength: number = 40) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  return (
    <div className={cn("flex flex-col h-full bg-muted/30 border-r", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-foreground">Chat-Verlauf</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNewChat}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Neuer Chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {threads.length} {threads.length === 1 ? 'Unterhaltung' : 'Unterhaltungen'}
        </div>
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {threads.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Noch keine Unterhaltungen</p>
              <p className="text-xs mt-1">Starte einen neuen Chat mit Buddy!</p>
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                className={cn(
                  "group relative p-3 rounded-lg cursor-pointer transition-colors",
                  "hover:bg-muted/60",
                  currentThreadId === thread.id 
                    ? "bg-primary/10 border border-primary/20" 
                    : "bg-background/50"
                )}
                onClick={() => onSelectThread(thread.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "font-medium text-sm leading-tight mb-1 truncate",
                      currentThreadId === thread.id 
                        ? "text-primary" 
                        : "text-foreground"
                    )}>
                      {truncateTitle(thread.title)}
                    </h4>
                    
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {thread.lastMessage}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimestamp(thread.timestamp)}</span>
                      <span>•</span>
                      <span>{thread.messageCount} Nachrichten</span>
                    </div>
                  </div>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteThread(thread.id);
                          }}
                          className={cn(
                            "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                            "hover:bg-destructive/10 hover:text-destructive"
                          )}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Chat löschen</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatHistory;