import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SyllabusItem {
  topic: string;
  subtopics?: string[];
  duration?: string;
}

export const aiService = {
  async chat(message: string, context?: string): Promise<{ response: string }> {
    const response = await api.post<{ response: string }>('/api/ai/chat', {
      message,
      context,
    });
    return response;
  },

  async explainTopic(topic: string, level?: string): Promise<string> {
    const response = await api.post<{ explanation: string }>('/api/ai/explain', {
      topic,
      level,
    });
    return response.explanation;
  },

  async answerQuestion(question: string, context?: string): Promise<string> {
    const response = await api.post<{ answer: string }>('/api/ai/answer', {
      question,
      context,
    });
    return response.answer;
  },

  async generateQuestions(topic: string, count?: number, difficulty?: string): Promise<any[]> {
    const response = await api.post<{ questions: any[] }>('/api/ai/questions', {
      topic,
      count,
      difficulty,
    });
    return response.questions;
  },

  async summarize(text: string): Promise<string> {
    const response = await api.post<{ summary: string }>('/api/ai/summarize', { text });
    return response.summary;
  },

  async generateSyllabusFromTopics(topics: string[], subject: string, courseName?: string): Promise<any> {
    const response = await api.post<{ syllabus: any }>('/api/ai/syllabus/from-topics', {
      topics,
      subject,
      course_name: courseName,
    });
    return response;
  },

  async generateSyllabusFromFile(fileContent: string, subject: string, courseName: string): Promise<any> {
    const response = await api.post<{ syllabus: any }>('/api/ai/syllabus/from-file', {
      file_content: fileContent,
      subject,
      course_name: courseName,
    });
    return response;
  },

  async generateAssessmentQuestions(subject: string, notes: string, durationMinutes: number): Promise<{ questions: any[] }> {
    const response = await api.post<{ questions: any[] }>('/api/study-session/assess', {
      subject,
      notes,
      duration_minutes: durationMinutes,
    });
    return response;
  },

  // Room AI
  async trainRoomAI(roomId: string, resourceIds?: string[]): Promise<void> {
    await api.post(`/api/rooms/${roomId}/ai/train`, { resource_ids: resourceIds });
  },

  async chatWithRoomAI(roomId: string, message: string): Promise<{ response: string }> {
    const response = await api.post<{ response: string }>(`/api/rooms/${roomId}/ai/chat`, {
      message,
    });
    return response;
  },

  async getRoomAIStatus(roomId: string): Promise<{ trained: boolean; last_trained?: string; resource_count?: number; message_count?: number }> {
    return api.get(`/api/rooms/${roomId}/ai/status`);
  },
};

export default aiService;
