// Client-side API functions for Buddy chatbot
// This handles communication with Groq API through secure proxy

export interface BuddyAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  data?: string; // base64 for images
}

export interface BuddyMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: BuddyAttachment[];
}

export interface BuddyChatRequest {
  messages: BuddyMessage[];
  role: 'student' | 'parent' | 'teacher';
  context?: string;
  stream?: boolean;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  hasAttachments?: boolean;
}

export interface BuddyChatResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface BuddyStreamChunk {
  content: string;
  done: boolean;
}

export class BuddyAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'BuddyAPIError';
  }
}

// Get auth token from Supabase session
const getAuthToken = async (): Promise<string | null> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
};

// Non-streaming chat completion
export const chatCompletion = async (
  request: BuddyChatRequest
): Promise<BuddyChatResponse> => {
  const token = await getAuthToken();
  if (!token) {
    throw new BuddyAPIError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  try {
    const { secureAPIProxy } = await import('@/lib/secure-api-proxy');
    
    const response = await secureAPIProxy.chatCompletion({
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments
      })),
      role: request.role,
      context: request.context,
      stream: false,
      model: request.model,
      temperature: request.temperature,
      max_tokens: request.max_tokens
    });

    return {
      content: response.content,
      usage: response.usage
    };
  } catch (error: any) {
    throw new BuddyAPIError(
      error.message || 'Network error occurred',
      error.status || 0,
      error.code || 'NETWORK_ERROR'
    );
  }
};

// Streaming chat completion
export const chatCompletionStream = async function* (
  request: BuddyChatRequest,
  onCancel?: () => boolean
): AsyncGenerator<string, void, unknown> {
  const token = await getAuthToken();
  if (!token) {
    throw new BuddyAPIError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  try {
    const { secureAPIProxy } = await import('@/lib/secure-api-proxy');
    
    const streamGenerator = secureAPIProxy.chatCompletionStream({
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments
      })),
      role: request.role,
      context: request.context,
      stream: true,
      model: request.model,
      temperature: request.temperature,
      max_tokens: request.max_tokens
    }, onCancel);

    for await (const chunk of streamGenerator) {
      if (onCancel && onCancel()) {
        break;
      }
      if (chunk.content) {
        yield chunk.content;
      }
    }
  } catch (error: any) {
    throw new BuddyAPIError(
      error.message || 'Stream error occurred',
      error.status || 0,
      error.code || 'STREAM_ERROR'
    );
  }
};

// Health check for Buddy service
export const healthCheck = async (): Promise<{ status: string; model?: string }> => {
  try {
    const response = await fetch('/api/buddy/health');
    if (!response.ok) {
      throw new BuddyAPIError(`Health check failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof BuddyAPIError) {
      throw error;
    }
    throw new BuddyAPIError('Health check network error');
  }
};

// Get available models
export const getModels = async (): Promise<string[]> => {
  const token = await getAuthToken();
  if (!token) {
    throw new BuddyAPIError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  try {
    const response = await fetch('/api/buddy/models', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new BuddyAPIError(`Failed to get models: ${response.status}`);
    }

    const data = await response.json();
    return data.models || [];
  } catch (error) {
    if (error instanceof BuddyAPIError) {
      throw error;
    }
    throw new BuddyAPIError('Failed to fetch models');
  }
};

// Analytics event tracking (client-side only)
export const trackBuddyEvent = async (
  event: string,
  data: Record<string, any>
): Promise<void> => {
  try {
    // Log analytics events to console for development
    // In production, this could be connected to analytics service
    console.log('Buddy Analytics:', {
      event,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Failed to track Buddy event:', error);
  }
};