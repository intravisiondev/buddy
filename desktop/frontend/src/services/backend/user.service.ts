import { supabase } from './auth.service';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'parent';
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  total_xp: number;
  level: number;
  streak_days: number;
  total_study_hours: number;
  badges_earned: number;
  rank: number;
}

export const userService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as UserProfile | null;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data as UserProfile;
  },

  async getUserStats(userId: string) {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as UserStats | null;
  },

  async updateUserStats(userId: string, updates: Partial<UserStats>) {
    const { data, error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async addXP(userId: string, xp: number) {
    const stats = await this.getUserStats(userId);
    const newXP = (stats?.total_xp || 0) + xp;
    const newLevel = Math.floor(newXP / 1000) + 1;

    return this.updateUserStats(userId, {
      total_xp: newXP,
      level: newLevel,
    });
  },

  async updateStreak(userId: string) {
    const stats = await this.getUserStats(userId);
    return this.updateUserStats(userId, {
      streak_days: (stats?.streak_days || 0) + 1,
    });
  },

  async addStudyTime(userId: string, hours: number) {
    const stats = await this.getUserStats(userId);
    return this.updateUserStats(userId, {
      total_study_hours: (stats?.total_study_hours || 0) + hours,
    });
  },

  async getUsersByRole(role: 'student' | 'teacher' | 'parent') {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role);

    if (error) throw error;
    return data as UserProfile[];
  },

  async searchUsers(query: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', `%${query}%`);

    if (error) throw error;
    return data as UserProfile[];
  },
};
