export interface QuestionAnswerRequest {
  question: string;
  subject: string;
  context?: string;
  previousMessages?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface Answer {
  answer: string;
  confidence: number;
  sources?: string[];
  relatedTopics?: string[];
  nextSteps?: string[];
}

export interface HomeworkHelp {
  problem: string;
  solution: string;
  steps: Array<{
    stepNumber: number;
    description: string;
    explanation: string;
  }>;
  concepts: string[];
  practiceProblems?: string[];
}

export const qaService = {
  async answerQuestion(request: QuestionAnswerRequest): Promise<Answer> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-answer-question`;
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
      throw new Error('Failed to answer question');
    }

    const data = await response.json();
    return {
      answer: data.answer,
      confidence: data.confidence || 0.85,
      sources: data.sources || [],
      relatedTopics: data.relatedTopics || [],
      nextSteps: data.nextSteps || [],
    };
  },

  async getHomeworkHelp(problem: string, subject: string): Promise<HomeworkHelp> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-homework-help`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ problem, subject }),
    });

    if (!response.ok) {
      throw new Error('Failed to get homework help');
    }

    const data = await response.json();
    return data;
  },

  async explainSolution(solution: string, subject: string): Promise<string> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-explain-solution`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ solution, subject }),
    });

    if (!response.ok) {
      throw new Error('Failed to explain solution');
    }

    const data = await response.json();
    return data.explanation;
  },

  async checkAnswer(question: string, userAnswer: string, subject: string): Promise<{
    isCorrect: boolean;
    feedback: string;
    correctAnswer?: string;
    explanation: string;
  }> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-check-answer`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ question, userAnswer, subject }),
    });

    if (!response.ok) {
      throw new Error('Failed to check answer');
    }

    const data = await response.json();
    return data;
  },

  async getHints(problem: string, subject: string, numberOfHints: number = 3): Promise<string[]> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-hints`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ problem, subject, numberOfHints }),
    });

    if (!response.ok) {
      throw new Error('Failed to get hints');
    }

    const data = await response.json();
    return data.hints;
  },

  async explainConcept(concept: string, subject: string, level: 'simple' | 'detailed' = 'simple'): Promise<string> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-explain-concept`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ concept, subject, level }),
    });

    if (!response.ok) {
      throw new Error('Failed to explain concept');
    }

    const data = await response.json();
    return data.explanation;
  },

  async getExamples(concept: string, subject: string, count: number = 3): Promise<Array<{
    example: string;
    explanation: string;
  }>> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-examples`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ concept, subject, count }),
    });

    if (!response.ok) {
      throw new Error('Failed to get examples');
    }

    const data = await response.json();
    return data.examples;
  },
};
