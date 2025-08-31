import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { X, Send, Settings, Plus, MessageCircle, Loader2, StopCircle, History, Shield } from 'lucide-react';
import { FileAttachmentComponent, FileAttachment } from './file-attachment';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatMessage } from './chat-message';
import { RoleSwitcher } from './role-switcher';
import { ContextBanner } from './context-banner';
import { ChatHistory, ChatThread } from './chat-history';
import { PrivacySettingsComponent } from './privacy-settings';
import { ContextSettingsComponent } from './context-settings';
import { useBuddyChat } from '@/hooks/use-buddy-chat';
import { cn } from '@/lib/utils';

type Role = 'student' | 'parent' | 'teacher';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose }) => {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearError,
    currentThreadId,
    threads,
    loadThread,
    deleteThread,
    newChat,
    cancelGeneration,
    currentRole,
    setRole
  } = useBuddyChat();

  const [input, setInput] = React.useState('');
  const [attachments, setAttachments] = React.useState<FileAttachment[]>([]);
  const [showHistory, setShowHistory] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = React.useState(false);
  const [showContextSettings, setShowContextSettings] = React.useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (messagesEndRef.current) {
        try {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } catch {}
      }
    }, 80);
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  // Additional effect to scroll on mount
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (messagesEndRef.current) {
        try {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
        } catch {}
      }
    }, 200);
    return () => clearTimeout(timeoutId);
  }, []);

  // Scroll to bottom when drawer opens
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        if (messagesEndRef.current) {
          try {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
          } catch {}
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, messages.length]);

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    
    const messageContent = input.trim();
    const messageAttachments = [...attachments];
    
    setInput('');
    setAttachments([]);
    
    // Convert FileAttachment to ChatAttachment format
    const chatAttachments = messageAttachments.map(att => ({
      id: att.id,
      name: att.name,
      type: att.file.type,
      size: att.size,
      data: att.preview // base64 data for images
    }));
    
    await sendMessage(messageContent, chatAttachments);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    newChat();
    setInput('');
    setAttachments([]);
    setShowHistory(false);
  };

  const handleSettingsToggle = () => {
    setShowSettings(!showSettings);
    setShowPrivacySettings(false);
    setShowContextSettings(false);
  };

  const handlePrivacyClick = () => {
    setShowPrivacySettings(true);
    setShowContextSettings(false);
  };

  const handleContextClick = () => {
    setShowContextSettings(true);
    setShowPrivacySettings(false);
  };

  const handleBackToSettings = () => {
    setShowPrivacySettings(false);
    setShowContextSettings(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className={cn(
          "p-0 flex flex-col transition-all duration-300",
          showHistory ? "sm:max-w-[1200px]" : "sm:max-w-[800px]"
        )}
      >
        {/* Header */}
        <SheetHeader className="p-4 pr-12 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">B</span>
              </div>
              <SheetTitle className="text-lg font-semibold">Buddy</SheetTitle>
              
              {/* Move buttons to the left */}
              <div className="flex items-center gap-1 sm:gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn(
                    "h-8 px-1 sm:px-2",
                    showHistory && "bg-muted"
                  )}
                >
                  <History className="h-4 w-4 sm:mr-1" />
                  <span className="hidden md:inline">Verlauf</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className={cn(
                    "h-8 px-2",
                    showSettings && "bg-muted"
                  )}
                >
                  <Shield className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewChat}
                  className="h-8 px-1 sm:px-2"
                >
                  <Plus className="h-4 w-4 sm:mr-1" />
                  <span className="hidden md:inline">Neu</span>
                </Button>
              </div>
            </div>
            
            {/* RoleSwitcher positioned on the right with more space */}
            <div className="flex-shrink-0 mr-8 md:mr-10">
              <RoleSwitcher 
                currentRole={currentRole} 
                onRoleChange={setRole}
                className="ml-2"
              />
            </div>
          </div>
        </SheetHeader>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat History Sidebar */}
          {showHistory && (
            <div className="w-80 border-r">
              <ChatHistory
                threads={threads.map(thread => ({
                  id: thread.id,
                  title: thread.title,
                  lastMessage: thread.messages[thread.messages.length - 1]?.content || 'Neue Unterhaltung',
                  timestamp: thread.updatedAt,
                  messageCount: thread.messages.length
                }))}
                currentThreadId={currentThreadId}
                onSelectThread={loadThread}
                onNewChat={handleNewChat}
                onDeleteThread={deleteThread}
              />
            </div>
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Settings Panel */}
            {showSettings && (
              <div className="border-b">
                {showPrivacySettings ? (
                   <PrivacySettingsComponent />
                 ) : showContextSettings ? (
                   <ContextSettingsComponent />
                ) : (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Einstellungen</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSettings(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Tabs defaultValue="privacy" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="privacy">Datenschutz</TabsTrigger>
                        <TabsTrigger value="context">Kontext</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="privacy" className="mt-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Datenschutz-Einstellungen</h4>
                              <p className="text-sm text-muted-foreground">
                                Verwalten Sie Ihre Privatsphäre und Datenfreigabe
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePrivacyClick}
                            >
                              Öffnen
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="context" className="mt-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Kontext-Einstellungen</h4>
                              <p className="text-sm text-muted-foreground">
                                Konfigurieren Sie, welche Informationen geteilt werden
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleContextClick}
                            >
                              Öffnen
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="p-4 border-b">
                <Alert variant="destructive">
                  <AlertDescription className="flex items-center justify-between">
                    <span>{error}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearError}
                      className="h-auto p-1 hover:bg-transparent"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Willkommen bei Buddy!</h3>
                    <p className="text-muted-foreground max-w-md">
                      Ich bin Ihr persönlicher Lernassistent. Stellen Sie mir Fragen zu Ihren Fächern, 
                      Hausaufgaben oder lassen Sie sich beim Lernen helfen.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))
                )}
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Buddy denkt nach...</span>
                  </div>
                )}
                
                {/* Invisible div for auto-scrolling */}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t space-y-3">
              {/* File Attachments */}
              <FileAttachmentComponent
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                className={attachments.length > 0 ? "" : "hidden"}
              />
              
              <div className="flex gap-2">
                {/* File Upload Controls */}
                <div className="flex flex-col gap-1">
                  <FileAttachmentComponent
                    attachments={[]}
                    onAttachmentsChange={(newAttachments) => {
                      setAttachments([...attachments, ...newAttachments]);
                    }}
                    className="flex-row"
                  />
                </div>
                
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Schreiben Sie Ihre Nachricht..."
                    className="min-h-[44px] max-h-[120px] resize-none pr-12"
                    disabled={isLoading}
                  />
                  
                  {isLoading ? (
                    <Button
                       size="sm"
                       variant="ghost"
                       onClick={cancelGeneration}
                       className="absolute right-2 top-2 h-8 w-8 p-0"
                     >
                       <StopCircle className="h-4 w-4" />
                     </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleSend}
                      disabled={!input.trim() && attachments.length === 0}
                      className="absolute right-2 top-2 h-8 w-8 p-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatDrawer;