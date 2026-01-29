export interface ExplanationRequest {
  topic: string;
  subject: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  format?: 'simple' | 'detailed' | 'step-by-step';
}

export interface SummaryRequest {
  content: string;
  maxLength?: number;
  focusPoints?: string[];
}

export interface QuestionGenerationRequest {
  topic: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple-choice' | 'short-answer' | 'essay' | 'problem-solving';
  count: number;
}

export interface GeneratedQuestion {
  question: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
}

export const contentService = {
  async explainTopic(request: ExplanationRequest): Promise<string> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-explain`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to generate explanation');
    }

    const data = await response.json();
    return data.explanation;
  },

  async summarizeContent(request: SummaryRequest): Promise<string> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-summarize`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to generate summary');
    }

    const data = await response.json();
    return data.summary;
  },

  async generateQuestions(request: QuestionGenerationRequest): Promise<GeneratedQuestion[]> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate-questions`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to generate questions');
    }

    const data = await response.json();
    return data.questions;
  },

  async generateStudyGuide(topic: string, subject: string): Promise<string> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-study-guide`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ topic, subject }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate study guide');
    }

    const data = await response.json();
    return data.studyGuide;
  },

  async generateFlashcards(topic: string, subject: string, count: number = 10): Promise<Array<{ front: string; back: string }>> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-flashcards`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ topic, subject, count }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate flashcards');
    }

    const data = await response.json();
    return data.flashcards;
  },

  async improveWriting(text: string, improvementType: 'grammar' | 'clarity' | 'academic' | 'concise'): Promise<string> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-improve-writing`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text, improvementType }),
    });

    if (!response.ok) {
      throw new Error('Failed to improve writing');
    }

    const data = await response.json();
    return data.improvedText;
  },
};
