import api from './api';

export interface GameTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  thumbnail_url?: string;
}

export interface Game {
  id: string;
  room_id: string;
  template_id: string;
  name: string;
  config?: any;
  created_by: string;
  created_at: string;
}

export interface GameResult {
  id: string;
  game_id: string;
  user_id: string;
  score: number;
  time_spent: number;
  completed_at: string;
}

export const gameService = {
  async getGameTemplates(): Promise<GameTemplate[]> {
    return api.get<GameTemplate[]>('/api/games/templates');
  },

  async getGameTemplate(templateId: string): Promise<GameTemplate> {
    return api.get<GameTemplate>(`/api/games/templates/${templateId}`);
  },

  async getRoomGames(roomId: string): Promise<Game[]> {
    return api.get<Game[]>(`/api/rooms/${roomId}/games`);
  },

  async createGame(roomId: string, game: Partial<Game>): Promise<Game> {
    return api.post<Game>(`/api/rooms/${roomId}/games`, game);
  },

  async getGame(gameId: string): Promise<Game> {
    return api.get<Game>(`/api/games/${gameId}`);
  },

  async playGame(gameId: string, answers?: string[], timeSpent?: number): Promise<{ session_id: string }> {
    return api.post(`/api/games/${gameId}/play`, { answers, time_spent: timeSpent });
  },

  async getGameResults(gameId: string): Promise<GameResult[]> {
    return api.get<GameResult[]>(`/api/games/${gameId}/results`);
  },

  async getGameStats(gameId: string): Promise<any> {
    return api.get(`/api/games/${gameId}/stats`);
  },

  async generateGame(
    roomId: string,
    templateId: string,
    subject: string,
    difficulty: string,
    questionCount: number
  ): Promise<any> {
    return api.post(`/api/rooms/${roomId}/games/generate`, {
      template_id: templateId,
      subject,
      difficulty,
      question_count: questionCount,
    });
  },

  async downloadGameBundle(gameId: string): Promise<string> {
    const response = await api.get<{ url: string }>(`/api/games/${gameId}/bundle`);
    return response.url;
  },

  async getRoomAnalytics(roomId: string): Promise<any> {
    return api.get(`/api/rooms/${roomId}/analytics`);
  },

  async exportAnalyticsCSV(roomId: string): Promise<void> {
    const response = await api.get<Blob>(`/api/rooms/${roomId}/analytics/export`, {
      headers: { Accept: 'text/csv' },
    } as any);
    // Trigger download
    const blob = new Blob([response as any], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `room-${roomId}-analytics.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};

export default gameService;
