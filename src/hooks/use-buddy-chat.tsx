import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { chatCompletionStream, trackBuddyEvent, BuddyAPIError, BuddyMessage } from '@/lib/api/buddy';
import { ChatThread } from '@/components/buddy';

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  data?: string; // base64 for images
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
  attachments?: ChatAttachment[];
}

interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

type Role = 'student' | 'parent' | 'teacher';

interface UseBuddyChatOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

interface UseBuddyChatReturn {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentRole: Role;
  contextEnabled: boolean;
  threads: ChatThread[];
  currentThreadId: string | null;
  tokenCount: number;
  maxTokens: number;
  
  // Actions
  sendMessage: (content: string, attachments?: ChatAttachment[]) => Promise<void>;
  setRole: (role: Role) => void;
  setContextEnabled: (enabled: boolean) => void;
  newChat: () => void;
  loadThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;
  cancelGeneration: () => void;
  regenerateLastMessage: () => Promise<void>;
  clearError: () => void;
  getCurrentContext: () => string | undefined;
}

const STORAGE_KEY = 'buddy-chat-data';
const MAX_THREADS = 10;

export const useBuddyChat = (options: UseBuddyChatOptions = {}): UseBuddyChatReturn => {
  const location = useLocation();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Load initial state from localStorage
  const loadStoredData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return {
          threads: data.threads?.map((thread: any) => ({
            ...thread,
            createdAt: new Date(thread.createdAt),
            updatedAt: new Date(thread.updatedAt),
            messages: thread.messages?.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })) || []
          })) || [],
          currentRole: data.currentRole || 'student',
          contextEnabled: data.contextEnabled ?? true,
          currentThreadId: data.currentThreadId || null
        };
      }
    } catch (error) {
      console.warn('Failed to load chat data from localStorage:', error);
    }
    return {
      threads: [],
      currentRole: 'student' as Role,
      contextEnabled: true,
      currentThreadId: null
    };
  };

  const initialData = loadStoredData();
  
  const [threads, setThreads] = useState<ChatThread[]>(initialData.threads);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(initialData.currentThreadId);
  const [currentRole, setCurrentRole] = useState<Role>(initialData.currentRole);
  const [contextEnabled, setContextEnabled] = useState<boolean>(initialData.contextEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenCount, setTokenCount] = useState(0);
  
  const maxTokens = options.maxTokens || 2000;
  
  // Get current thread
  const currentThread = threads.find(t => t.id === currentThreadId);
  const messages = currentThread?.messages || [];
  
  // Save to localStorage
  const saveToStorage = useCallback((newThreads: ChatThread[], newCurrentThreadId: string | null) => {
    try {
      const dataToSave = {
        threads: newThreads,
        currentRole,
        contextEnabled,
        currentThreadId: newCurrentThreadId
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('Failed to save chat data to localStorage:', error);
    }
  }, [currentRole, contextEnabled]);
  
  // Get current page context
  const getCurrentContext = useCallback(() => {
    if (!contextEnabled) return undefined;
    
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    
    // Extract relevant parameters
    const subject = searchParams.get('subject');
    const grade = searchParams.get('grade');
    const semester = searchParams.get('semester');
    const noteId = searchParams.get('noteId');
    const view = searchParams.get('view');
    
    let context = '';
    
    switch (path) {
      case '/':
        context = 'Dashboard - Hauptübersicht mit aktuellen Noten, anstehenden Terminen und Lernfortschritt';
        break;
      case '/subjects':
        if (subject) {
          context = `Fach: ${subject}`;
          if (semester) context += ` (${semester})`;
          context += ' - Detailansicht mit Noten, Aufgaben und Materialien';
        } else {
          context = 'Fächer-Übersicht - Alle Schulfächer und deren Leistungsstand';
        }
        break;
      case '/notes':
        if (noteId) {
          context = 'Notiz-Detailansicht - Bearbeitung einer spezifischen Notiz';
          if (subject) context += ` für ${subject}`;
        } else if (subject) {
          context = `Notizen für ${subject} - Übersicht aller Notizen und Materialien`;
        } else {
          context = 'Notizen-Übersicht - Alle gespeicherten Notizen und Lernmaterialien';
        }
        break;
      case '/calendar':
        context = 'Kalender - Termine, Prüfungen, Hausaufgaben und wichtige Schulereignisse';
        break;
      case '/analysis':
        if (subject) {
          context = `Leistungsanalyse für ${subject} - Detaillierte Notenentwicklung und Trends`;
        } else {
          context = 'Leistungsanalyse - Gesamtübersicht über Noten, Trends und Verbesserungsmöglichkeiten';
        }
        break;
      case '/profile':
        context = 'Profil-Einstellungen - Persönliche Daten, Präferenzen und Konto-Verwaltung';
        break;
      case '/grades':
        if (subject) {
          context = `Noten für ${subject}`;
          if (semester) context += ` (${semester})`;
          context += ' - Detaillierte Notenliste und Bewertungen';
        } else {
          context = 'Noten-Übersicht - Alle Schulnoten nach Fächern und Semestern';
        }
        break;
      default:
        context = 'StudyBuddy App - Digitales Lernmanagementsystem für Schüler';
    }
    
    // Add additional context based on view mode
    if (view === 'edit') {
      context += ' (Bearbeitungsmodus)';
    } else if (view === 'create') {
      context += ' (Erstellungsmodus)';
    }
    
    return context;
  }, [location, contextEnabled]);
  
  // Create new thread
  const createNewThread = useCallback((firstMessage: string): ChatThread => {
    const now = new Date();
    return {
      id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : ''),
      messages: [],
      createdAt: now,
      updatedAt: now
    };
  }, []);
  
  // Update thread
  const updateThread = useCallback((threadId: string, updates: Partial<ChatThread>) => {
    setThreads(prev => {
      const newThreads = prev.map(thread => 
        thread.id === threadId 
          ? { ...thread, ...updates, updatedAt: new Date() }
          : thread
      );
      saveToStorage(newThreads, currentThreadId);
      return newThreads;
    });
  }, [currentThreadId, saveToStorage]);
  
  // Generate system prompt locally
  const generateSystemPrompt = useCallback((role: Role, context?: string) => {
    const basePrompts = {
      student: 'Du bist Buddy, ein hilfsreicher KI-Assistent für Schüler. Du hilfst beim Lernen, erklärst Konzepte verständlich und gibst Lerntipps. Du bist freundlich, geduldig und ermutigend.',
      parent: 'Du bist Buddy, ein hilfsreicher KI-Assistent für Eltern. Du hilfst bei Fragen zur Bildung ihrer Kinder, erklärst Schulsysteme und gibst Ratschläge zur Lernunterstützung.',
      teacher: 'Du bist Buddy, ein hilfsreicher KI-Assistent für Lehrkräfte. Du hilfst bei pädagogischen Fragen, Unterrichtsplanung und der Bewertung von Schülerleistungen.'
    };
    
    let prompt = basePrompts[role];
    
    if (context) {
      prompt += ` Der Nutzer befindet sich gerade in: ${context}.`;
    }
    
    prompt += ' Antworte auf Deutsch und sei präzise und hilfreich.';
    
    return prompt;
  }, []);

  // Send message
  const sendMessage = useCallback(async (content: string, attachments?: ChatAttachment[]) => {
    if ((!content.trim() && (!attachments || attachments.length === 0)) || isLoading) return;
    
    setError(null);
    setIsLoading(true);
    
    // Track analytics
    trackBuddyEvent('buddy_sent', {
      role: currentRole,
      context_enabled: contextEnabled,
      message_length: content.length
    });
    
    try {
      // Create or get current thread
      let threadId = currentThreadId;
      if (!threadId) {
        const newThread = createNewThread(content);
        setThreads(prev => {
          const newThreads = [newThread, ...prev].slice(0, MAX_THREADS);
          saveToStorage(newThreads, newThread.id);
          return newThreads;
        });
        setCurrentThreadId(newThread.id);
        threadId = newThread.id;
      }
      
      // Add user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        content: content.trim(),
        role: 'user',
        timestamp: new Date(),
        attachments: attachments
      };
      
      updateThread(threadId, {
        messages: [...(currentThread?.messages || []), userMessage]
      });
      
      // Prepare messages for API
      const context = getCurrentContext();
      const systemPrompt = generateSystemPrompt(currentRole, context);
      
      const apiMessages: BuddyMessage[] = [
        { role: 'system', content: systemPrompt },
        ...(currentThread?.messages || []).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          attachments: msg.attachments
        })),
        { role: 'user', content: content.trim(), attachments: attachments }
      ];
      
      // Create assistant message for streaming
      const assistantMessageId = `msg_${Date.now()}_assistant`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: true
      };
      
      updateThread(threadId, {
        messages: [...(currentThread?.messages || []), userMessage, assistantMessage]
      });
      
      // Set up cancellation
      let isCancelled = false;
      const checkCancellation = () => {
        if (abortControllerRef.current?.signal.aborted) {
          isCancelled = true;
          return true;
        }
        return false;
      };
      
      // Track stream start
      trackBuddyEvent('buddy_stream_started', {
        role: currentRole,
        context_enabled: contextEnabled
      });
      
      // Stream response
      let fullContent = '';
      const stream = chatCompletionStream(
        {
          messages: apiMessages,
          role: currentRole,
          context: contextEnabled ? context : undefined,
          stream: true,
          model: options.model,
          temperature: options.temperature,
          max_tokens: options.maxTokens
        },
        checkCancellation
      );
      
      for await (const chunk of stream) {
        if (isCancelled) break;
        
        fullContent += chunk;
        
        // Update message content
        setThreads(prev => {
          const newThreads = prev.map(thread => {
            if (thread.id === threadId) {
              return {
                ...thread,
                messages: thread.messages.map(msg => 
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullContent }
                    : msg
                ),
                updatedAt: new Date()
              };
            }
            return thread;
          });
          saveToStorage(newThreads, currentThreadId);
          return newThreads;
        });
      }
      
      // Mark streaming as complete
      if (!isCancelled) {
        updateThread(threadId, {
          messages: (currentThread?.messages || []).concat(userMessage, {
            ...assistantMessage,
            content: fullContent,
            isStreaming: false
          })
        });
        
        // Track completion
        trackBuddyEvent('buddy_stream_completed', {
          role: currentRole,
          context_enabled: contextEnabled,
          response_length: fullContent.length
        });
      }
      
    } catch (err) {
      const errorMessage = err instanceof BuddyAPIError 
        ? `Buddy Fehler: ${err.message}`
        : 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.';
      
      setError(errorMessage);
      console.error('Chat error:', err);
      
      // Track error
      trackBuddyEvent('buddy_error', {
        role: currentRole,
        error: err instanceof BuddyAPIError ? err.code : 'UNKNOWN_ERROR'
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [isLoading, currentThreadId, currentThread, currentRole, contextEnabled, getCurrentContext, options, createNewThread, updateThread, saveToStorage, generateSystemPrompt]);
  
  // Cancel generation
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);
  
  // New chat
  const newChat = useCallback(() => {
    setCurrentThreadId(null);
    setError(null);
    saveToStorage(threads, null);
  }, [threads, saveToStorage]);
  
  // Load thread
  const loadThread = useCallback((threadId: string) => {
    setCurrentThreadId(threadId);
    setError(null);
    saveToStorage(threads, threadId);
  }, [threads, saveToStorage]);
  
  // Delete thread
  const deleteThread = useCallback((threadId: string) => {
    setThreads(prev => {
      const newThreads = prev.filter(t => t.id !== threadId);
      const newCurrentThreadId = currentThreadId === threadId ? null : currentThreadId;
      saveToStorage(newThreads, newCurrentThreadId);
      if (currentThreadId === threadId) {
        setCurrentThreadId(null);
      }
      return newThreads;
    });
  }, [currentThreadId, saveToStorage]);
  
  // Regenerate last message
  const regenerateLastMessage = useCallback(async () => {
    if (!currentThread || currentThread.messages.length < 2) return;
    
    const lastUserMessage = [...currentThread.messages]
      .reverse()
      .find(msg => msg.role === 'user');
    
    if (!lastUserMessage) return;
    
    // Remove last assistant message
    const messagesWithoutLast = currentThread.messages.slice(0, -1);
    updateThread(currentThread.id, { messages: messagesWithoutLast });
    
    // Resend the last user message
    await sendMessage(lastUserMessage.content, lastUserMessage.attachments);
  }, [currentThread, updateThread, sendMessage]);
  
  // Set role with persistence
  const setRole = useCallback((role: Role) => {
    setCurrentRole(role);
    saveToStorage(threads, currentThreadId);
  }, [threads, currentThreadId, saveToStorage]);
  
  // Set context enabled with persistence
  const setContextEnabledPersistent = useCallback((enabled: boolean) => {
    setContextEnabled(enabled);
    saveToStorage(threads, currentThreadId);
  }, [threads, currentThreadId, saveToStorage]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    // State
    messages,
    isLoading,
    error,
    currentRole,
    contextEnabled,
    threads,
    currentThreadId,
    tokenCount,
    maxTokens,
    
    // Actions
    sendMessage,
    setRole,
    setContextEnabled: setContextEnabledPersistent,
    newChat,
    loadThread,
    deleteThread,
    cancelGeneration,
    regenerateLastMessage,
    clearError,
    getCurrentContext
  };
};