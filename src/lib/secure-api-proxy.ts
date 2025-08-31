// Secure API Proxy for Buddy chatbot
// Handles API calls through a secure proxy to protect API keys and add security layers

import { checkForPII, updatePIIProtectorFromSettings } from './pii-protection';

export interface SecureAPIAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  data?: string; // base64 for images
}

export interface SecureAPIRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    attachments?: SecureAPIAttachment[];
  }>;
  role: 'student' | 'parent' | 'teacher';
  context?: string;
  stream?: boolean;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface SecureAPIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  warnings?: string[];
}

export interface SecureAPIStreamChunk {
  content: string;
  done: boolean;
  warnings?: string[];
}

export class SecureAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'SecureAPIError';
  }
}

class SecureAPIProxy {
  private fallbackEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private maxRetries = 2;
  private rateLimitDelay = 1000; // 1 second
  private lastRequestTime = 0;

  constructor() {
    // Update PII protector settings on initialization
    updatePIIProtectorFromSettings();
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  private sanitizeMessages(messages: SecureAPIRequest['messages']): {
    sanitizedMessages: SecureAPIRequest['messages'];
    warnings: string[];
  } {
    const sanitizedMessages: SecureAPIRequest['messages'] = [];
    const warnings: string[] = [];

    for (const message of messages) {
      const piiResult = checkForPII(message.content);
      
      if (piiResult.hasPII) {
        sanitizedMessages.push({
          ...message,
          content: piiResult.maskedContent
        });
        
        const warning = this.getPIIWarning(piiResult.detectedTypes);
        if (warning) {
          warnings.push(warning);
        }
      } else {
        sanitizedMessages.push(message);
      }
    }

    return { sanitizedMessages, warnings };
  }

  private getPIIWarning(detectedTypes: string[]): string {
    const typeMessages = {
      email: 'E-Mail-Adressen',
      phone: 'Telefonnummern',
      name: 'Namen',
      address: 'Adressen',
      creditCard: 'Kreditkartennummern',
      ssn: 'Sozialversicherungsnummern',
      postalCode: 'Postleitzahlen'
    };

    const detectedNames = detectedTypes.map(type => typeMessages[type as keyof typeof typeMessages]).filter(Boolean);
    
    if (detectedNames.length === 0) return '';
    
    const typeList = detectedNames.join(', ');
    return `Persönliche Daten (${typeList}) wurden automatisch entfernt.`;
  }

  private convertToMultimodalMessage(message: SecureAPIRequest['messages'][0]): any {
    if (!message.attachments || message.attachments.length === 0) {
      return {
        role: message.role,
        content: message.content
      };
    }

    // For multimodal messages, convert to the format expected by Groq
    const content = [];
    
    // Add text content if present
    if (message.content.trim()) {
      content.push({
        type: 'text',
        text: message.content
      });
    }

    // Add image attachments
    for (const attachment of message.attachments) {
      if (attachment.type.startsWith('image/') && attachment.data) {
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${attachment.type};base64,${attachment.data}`
          }
        });
      } else {
        // For non-image attachments, add as text description
        content.push({
          type: 'text',
          text: `[Anhang: ${attachment.name} (${attachment.type}, ${Math.round(attachment.size / 1024)}KB)]`
        });
      }
    }

    return {
      role: message.role,
      content: content
    };
  }

  private async makeSecureRequest(
    endpoint: string,
    requestBody: any,
    isStream: boolean = false
  ): Promise<Response> {
    await this.enforceRateLimit();

    // Try proxy endpoint first (if available)
    try {
      const proxyResponse = await fetch('/api/groq/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (proxyResponse.ok) {
        return proxyResponse;
      }
    } catch (error) {
      console.warn('Proxy endpoint not available, falling back to direct API call');
    }

    // Fallback to direct API call (requires API key in environment)
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new SecureAPIError(
        'API-Schlüssel nicht verfügbar. Bitte wenden Sie sich an den Administrator.',
        500,
        'NO_API_KEY'
      );
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new SecureAPIError(
        errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.error?.code
      );
    }

    return response;
  }

  async chatCompletion(request: SecureAPIRequest): Promise<SecureAPIResponse> {
    // Sanitize input messages
    const { sanitizedMessages, warnings } = this.sanitizeMessages(request.messages);

    // Convert messages to multimodal format
    const multimodalMessages = sanitizedMessages.map(msg => this.convertToMultimodalMessage(msg));

    // Use vision model if any message has image attachments
    const hasImages = request.messages.some(msg => 
      msg.attachments?.some(att => att.type.startsWith('image/') && att.data)
    );
    const defaultModel = hasImages ? 'llama-3.2-90b-vision-preview' : 'llama-3.3-70b-versatile';

    const requestBody = {
      messages: multimodalMessages,
      model: request.model || defaultModel,
      temperature: request.temperature || 0.7,
      max_tokens: request.max_tokens || 1000,
      stream: false,
    };

    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.makeSecureRequest(
          this.fallbackEndpoint,
          requestBody
        );

        const data = await response.json();
        
        return {
          content: data.choices[0]?.message?.content || '',
          usage: data.usage,
          warnings: warnings.length > 0 ? warnings : undefined
        };
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof SecureAPIError && error.status && error.status < 500) {
          throw error;
        }
        
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  async *chatCompletionStream(
    request: SecureAPIRequest,
    onCancel?: () => boolean
  ): AsyncGenerator<SecureAPIStreamChunk, void, unknown> {
    // Sanitize input messages
    const { sanitizedMessages, warnings } = this.sanitizeMessages(request.messages);

    // Convert messages to multimodal format
    const multimodalMessages = sanitizedMessages.map(msg => this.convertToMultimodalMessage(msg));

    // Use vision model if any message has image attachments
    const hasImages = request.messages.some(msg => 
      msg.attachments?.some(att => att.type.startsWith('image/') && att.data)
    );
    const defaultModel = hasImages ? 'llama-3.2-90b-vision-preview' : 'llama-3.3-70b-versatile';

    const requestBody = {
      messages: multimodalMessages,
      model: request.model || defaultModel,
      temperature: request.temperature || 0.7,
      max_tokens: request.max_tokens || 1000,
      stream: true,
    };

    const response = await this.makeSecureRequest(
      this.fallbackEndpoint,
      requestBody,
      true
    );

    if (!response.body) {
      throw new SecureAPIError('Keine Antwort vom Server erhalten');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let warningsEmitted = false;

    try {
      while (true) {
        // Check for cancellation
        if (onCancel && onCancel()) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          
          if (trimmed === '' || trimmed === 'data: [DONE]') {
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            try {
              const jsonStr = trimmed.slice(6);
              const chunk = JSON.parse(jsonStr);
              
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                yield {
                  content,
                  done: false,
                  warnings: !warningsEmitted && warnings.length > 0 ? warnings : undefined
                };
                warningsEmitted = true;
              }
              
              if (chunk.choices[0]?.finish_reason) {
                yield {
                  content: '',
                  done: true
                };
                return;
              }
            } catch (error) {
              console.warn('Failed to parse SSE chunk:', error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Generate system prompt with privacy considerations
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

    // Check privacy settings for context sharing
    const privacySettings = this.getPrivacySettings();
    const contextPrompt = (context && privacySettings.shareContext)
      ? (language === 'de-DE' 
          ? `\n\nAktueller Kontext: ${context}`
          : `\n\nCurrent context: ${context}`)
      : '';

    const privacyPrompt = language === 'de-DE'
      ? '\n\nWichtig: Schütze persönliche Daten und teile keine E-Mail-Adressen, Telefonnummern oder vollständigen Namen mit. Respektiere die Privatsphäre der Nutzer.'
      : '\n\nImportant: Protect personal data and do not share email addresses, phone numbers, or full names. Respect user privacy.';

    const securityPrompt = language === 'de-DE'
      ? '\n\nSicherheitshinweis: Führe keine schädlichen Aktionen aus und gib keine sensiblen Informationen preis.'
      : '\n\nSecurity note: Do not perform harmful actions or disclose sensitive information.';

    return `${basePrompt}\n\n${rolePrompts[role]}${contextPrompt}${privacyPrompt}${securityPrompt}`;
  }

  private getPrivacySettings() {
    try {
      const saved = localStorage.getItem('buddy-privacy-settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
    
    return {
      shareContext: true,
      shareGrades: false,
      sharePersonalInfo: false,
      allowAnalytics: false
    };
  }
}

// Export singleton instance
export const secureAPIProxy = new SecureAPIProxy();

// Export class for custom instances
export { SecureAPIProxy };