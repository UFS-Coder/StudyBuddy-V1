import { secureAPIProxy, SecureAPIRequest, SecureAPIResponse, SecureAPIError } from './secure-api-proxy';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqChatRequest {
  messages: GroqMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GroqStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }[];
}

// Legacy compatibility wrapper for existing code
class GroqAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'GroqAPIError';
  }
}

class GroqAPI {
  private baseUrl = '/api/groq'; // Proxy endpoint
  private defaultModel = 'llama-3.3-70b-versatile';
  private maxRetries = 2;

  // Legacy method kept for backward compatibility
  private async makeRequest(
    endpoint: string,
    options: RequestInit
  ): Promise<Response> {
    // This method is deprecated and now uses secure proxy internally
    throw new GroqAPIError(
      'Direct API calls are deprecated. Use chatCompletion or chatCompletionStream methods instead.',
      400,
      'DEPRECATED_METHOD'
    );
  }

  async chatCompletion(
    messages: GroqMessage[],
    options: Partial<GroqChatRequest> = {},
    role: 'student' | 'parent' | 'teacher' = 'student',
    context?: string
  ): Promise<GroqChatResponse> {
    try {
      const secureRequest: SecureAPIRequest = {
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        role,
        context,
        stream: false,
        model: options.model || this.defaultModel,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000
      };

      const response = await secureAPIProxy.chatCompletion(secureRequest);
      
      // Convert SecureAPIResponse back to GroqChatResponse format
       return {
         id: 'groq-' + Date.now(),
         object: 'chat.completion',
         created: Date.now(),
         model: this.defaultModel,
         choices: [{
           index: 0,
           message: {
             role: 'assistant',
             content: response.content
           },
           finish_reason: 'stop'
         }],
         usage: response.usage || {
           prompt_tokens: 0,
           completion_tokens: 0,
           total_tokens: 0
         }
       };
    } catch (error) {
      if (error instanceof SecureAPIError) {
        throw new GroqAPIError(error.message, error.status, error.code);
      }
      throw error;
    }
  }

  async *chatCompletionStream(
    messages: GroqMessage[],
    options: Partial<GroqChatRequest> = {},
    role: 'student' | 'parent' | 'teacher' = 'student',
    context?: string,
    onCancel?: () => boolean
  ): AsyncGenerator<string, void, unknown> {
    try {
      const secureRequest: SecureAPIRequest = {
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        role,
        context,
        stream: true,
        model: options.model || this.defaultModel,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000
      };

      const streamGenerator = secureAPIProxy.chatCompletionStream(secureRequest, onCancel);
       
       for await (const chunk of streamGenerator) {
         if (onCancel && onCancel()) {
           break;
         }
         if (chunk.content) {
           yield chunk.content;
         }
       }
    } catch (error) {
      if (error instanceof SecureAPIError) {
        throw new GroqAPIError(error.message, error.status, error.code);
      }
      throw error;
    }
  }

  generateSystemPrompt(
    role: 'student' | 'parent' | 'teacher',
    context?: string,
    language: string = 'de-DE'
  ): string {
    const basePrompt = language === 'de-DE' 
      ? 'Du bist Buddy, ein hilfreicher KI-Assistent für die StudyBuddy-App.'
      : 'You are Buddy, a helpful AI assistant for the StudyBuddy app.';

    const rolePrompts = {
      student: language === 'de-DE'
        ? 'Du hilfst Schülern beim Lernen, gibst Studientipps und erklärst schwierige Konzepte. Du kannst keine Noten bearbeiten oder ändern.'
        : 'You help students with learning, provide study tips, and explain difficult concepts. You cannot edit or change grades.',
      parent: language === 'de-DE'
        ? 'Du hilfst Eltern dabei, den Fortschritt ihrer Kinder zu verstehen und gibst Beratung zur Unterstützung. Du zeigst nur zusammenfassende Informationen.'
        : 'You help parents understand their children\'s progress and provide guidance on how to support them. You only show summary information.',
      teacher: language === 'de-DE'
        ? 'Du hilfst Lehrern bei der Bewertung, Rubrik-Interpretation und Arbeitsabläufen. Du kannst bei der Notenvergabe helfen, aber keine Massendatenexporte durchführen.'
        : 'You help teachers with grading, rubric interpretation, and workflows. You can assist with grading but cannot perform mass data exports.'
    };

    const contextPrompt = context 
      ? (language === 'de-DE' 
          ? `\n\nAktueller Kontext: ${context}`
          : `\n\nCurrent context: ${context}`)
      : '';

    const privacyPrompt = language === 'de-DE'
      ? '\n\nWichtig: Schütze persönliche Daten und teile keine E-Mail-Adressen oder vollständigen Namen mit, es sei denn, es ist ausdrücklich erlaubt.'
      : '\n\nImportant: Protect personal data and do not share email addresses or full names unless explicitly allowed.';

    return `${basePrompt}\n\n${rolePrompts[role]}${contextPrompt}${privacyPrompt}`;
  }
}

export const groqAPI = new GroqAPI();
export { GroqAPIError };
export type { GroqMessage, GroqChatRequest, GroqChatResponse };