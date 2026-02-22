import api from './api';

export interface UserProfile {
  id: string;
  user_id: string;
  bio?: string;
  avatar_url?: string;
  school?: string;
  grade?: string;
  interests?: string[];
}

export interface UserStats {
  study_streak: number;
  total_xp: number;
  weekly_rank: number;
  today_hours: number;
  level: number;
  weekly_xp: number;
  gems: number;
  tokens: number;
  badges_earned: number;
}

export interface DashboardStats extends UserStats {}

export const userService = {
  async getMyProfile(): Promise<UserProfile> {
    return api.get<UserProfile>('/api/users/me/profile');
  },

  async updateMyProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    return api.put<UserProfile>('/api/users/me/profile', profile);
  },

  async getMyStats(): Promise<UserStats> {
    return api.get<UserStats>('/api/users/me/stats');
  },

  async getUserProfile(userId: string): Promise<UserProfile> {
    return api.get<UserProfile>(`/api/users/${userId}/profile`);
  },

  async getUserStats(userId: string): Promise<UserStats> {
    return api.get<UserStats>(`/api/users/${userId}/stats`);
  },

  async searchUsers(query: string): Promise<any[]> {
    return api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
  },

  async addXP(amount: number): Promise<void> {
    await api.post('/api/users/me/xp', { amount });
  },

  // Parent-specific
  async getChildren(): Promise<any[]> {
    return api.get('/api/users/me/children');
  },

  async createChildAccount(data: any): Promise<any> {
    return api.post('/api/users/me/children', data);
  },

  async getMyBadges(): Promise<any[]> {
    return api.get('/api/users/me/badges');
  },
};

export default userService;
