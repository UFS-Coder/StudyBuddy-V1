import React from 'react';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Flag, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  data?: string; // base64 for images
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
  attachments?: ChatAttachment[];
}

interface ChatMessageProps {
  message: Message;
  onCopy?: (content: string) => void;
  onRegenerate?: () => void;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
  onInsertToEditor?: (content: string) => void;
  onReport?: (messageId: string, reason: string) => void;
  showControls?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onCopy,
  onRegenerate,
  onFeedback,
  onInsertToEditor,
  onReport,
  showControls = true
}) => {
  const [copied, setCopied] = React.useState(false);
  const [feedback, setFeedback] = React.useState<'positive' | 'negative' | null>(null);
  const [showReportDialog, setShowReportDialog] = React.useState(false);
  const [reportReason, setReportReason] = React.useState<string>('');
  
  const isAssistant = message.role === 'assistant';
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.(message.content);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
    onFeedback?.(message.id, type);
  };

  const handleInsertToEditor = () => {
    onInsertToEditor?.(message.content);
  };

  const handleReport = () => {
    if (reportReason) {
      onReport?.(message.id, reportReason);
      setShowReportDialog(false);
      setReportReason('');
    }
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, index) => {
        // Handle code blocks
        if (line.startsWith('```')) {
          return null; // Skip code block markers for now
        }
        
        // Handle bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Handle italic text
        line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return (
          <span key={index} dangerouslySetInnerHTML={{ __html: line }} />
        );
      })
      .filter(Boolean)
      .reduce((acc, curr, index) => {
        if (index > 0) acc.push(<br key={`br-${index}`} />);
        acc.push(curr);
        return acc;
      }, [] as React.ReactNode[]);
  };

  return (
    <>
      <div className={cn(
        "flex gap-3 p-4",
        isUser ? "justify-end" : "justify-start"
      )}>
        {/* Avatar for assistant */}
        {isAssistant && (
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-primary-foreground font-bold text-sm">B</span>
          </div>
        )}

        {/* Message content */}
        <div className={cn(
          "max-w-[80%] group relative",
          isAssistant ? "" : "bg-primary text-primary-foreground rounded-lg p-3",
          isUser && "order-first"
        )}>
          <div className={cn(
            "prose max-w-none",
            isAssistant ? "prose-slate text-gray-800 dark:text-gray-200 text-sm leading-relaxed" : "prose-invert text-xs"
          )} style={isAssistant ? {fontSize: '14px', lineHeight: '1.6'} : {fontSize: '90%'}}>
            {formatContent(message.content)}
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map((attachment) => (
                <div key={attachment.id} className={cn(
                  "flex items-center gap-2 p-2 rounded border",
                  isAssistant ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" : "bg-background/50"
                )}>
                  {attachment.type.startsWith('image/') && attachment.data ? (
                    <div className="flex items-center gap-2">
                      <img 
                        src={`data:${attachment.type};base64,${attachment.data}`}
                        alt={attachment.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="text-xs">
                        <div className="font-medium">{attachment.name}</div>
                        <div className="text-muted-foreground">{Math.round(attachment.size / 1024)}KB</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <div className="text-xs">
                        <div className="font-medium">{attachment.name}</div>
                        <div className="text-muted-foreground">{attachment.type} • {Math.round(attachment.size / 1024)}KB</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Message controls for assistant messages */}
          {isAssistant && showControls && (
            <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Copy button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 w-6 p-0"
                title="Kopieren"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
              
              {/* Regenerate button (only for last message) */}
              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  className="h-6 w-6 p-0"
                  title="Neu generieren"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
              
              {/* Feedback buttons */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback('positive')}
                className={`h-6 w-6 p-0 ${feedback === 'positive' ? 'text-green-600' : ''}`}
                title="Hilfreich"
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback('negative')}
                className={`h-6 w-6 p-0 ${feedback === 'negative' ? 'text-red-600' : ''}`}
                title="Nicht hilfreich"
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
              
              {/* Insert to editor button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleInsertToEditor}
                className="h-6 w-6 p-0"
                title="In Editor einfügen"
              >
                <FileText className="h-3 w-3" />
              </Button>
              
              {/* Report button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReportDialog(true)}
                className="h-6 w-6 p-0"
                title="Melden"
              >
                <Flag className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Avatar for user */}
        {isUser && (
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-secondary-foreground font-bold text-sm">U</span>
          </div>
        )}
      </div>
      
      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nachricht melden</DialogTitle>
            <DialogDescription>
              Warum möchten Sie diese Nachricht melden?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger>
                <SelectValue placeholder="Grund auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inappropriate">Unangemessener Inhalt</SelectItem>
                <SelectItem value="incorrect">Falsche Informationen</SelectItem>
                <SelectItem value="harmful">Schädlicher Inhalt</SelectItem>
                <SelectItem value="spam">Spam oder irrelevant</SelectItem>
                <SelectItem value="other">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReportDialog(false);
                setReportReason('');
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleReport}
              disabled={!reportReason}
              variant="destructive"
            >
              Melden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatMessage;