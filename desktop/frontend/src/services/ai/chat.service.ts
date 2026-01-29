export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatContext {
  userId: string;
  subject?: string;
  recentTopics?: string[];
  userLevel?: number;
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  resources?: Array<{
    title: string;
    type: 'video' | 'document' | 'article' | 'practice';
    url?: string;
  }>;
}

export const chatService = {
  async sendMessage(
    message: string,
    context: ChatContext,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    const prompt = this.buildPrompt(message, context, conversationHistory);

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt,
        context,
        history: conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    return this.parseResponse(data);
  },

  buildPrompt(message: string, context: ChatContext, history: ChatMessage[]): string {
    let prompt = `You are Buddy, an AI learning assistant designed to help students learn effectively.\n\n`;

    if (context.subject) {
      prompt += `The student is currently studying: ${context.subject}\n`;
    }

    if (context.userLevel) {
      prompt += `Student level: ${context.userLevel}\n`;
    }

    if (context.recentTopics && context.recentTopics.length > 0) {
      prompt += `Recent topics: ${context.recentTopics.join(', ')}\n`;
    }

    prompt += `\nConversation history:\n`;
    history.slice(-5).forEach(msg => {
      prompt += `${msg.role}: ${msg.content}\n`;
    });

    prompt += `\nStudent question: ${message}\n\n`;
    prompt += `Provide a helpful, encouraging response. Include relevant examples and suggestions for further learning when appropriate.`;

    return prompt;
  },

  parseResponse(data: any): ChatResponse {
    return {
      message: data.message || data.response || '',
      suggestions: data.suggestions || [],
      resources: data.resources || [],
    };
  },

  async getQuickActions(context: ChatContext): Promise<string[]> {
    const actions = [
      'Explain this topic',
      'Give me practice problems',
      'Summarize my notes',
      'Study tips',
      'Create a quiz',
    ];

    if (context.subject) {
      actions.push(`Help with ${context.subject}`);
    }

    return actions;
  },

  async suggestFollowUpQuestions(lastMessage: string, context: ChatContext): Promise<string[]> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-suggestions`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: lastMessage,
        context,
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.suggestions || [];
  },
};
