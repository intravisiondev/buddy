import api from './api';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  xp: number;
  level: number;
  avatar_url?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at?: string;
}

export const leaderboardService = {
  async getLeaderboard(period?: 'daily' | 'weekly' | 'monthly' | 'all'): Promise<LeaderboardEntry[]> {
    const query = period ? `?period=${period}` : '';
    return api.get<LeaderboardEntry[]>(`/api/leaderboard${query}`);
  },

  async getMyBadges(): Promise<Badge[]> {
    return api.get<Badge[]>('/api/badges/my');
  },
};

export default leaderboardService;
