import { supabase } from './auth.service';

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  total_xp: number;
  level: number;
  streak_days: number;
  badges_earned: number;
  rank: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xp_reward: number;
  criteria: Record<string, any>;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export const leaderboardService = {
  async getGlobalLeaderboard(limit: number = 100) {
    const { data, error } = await supabase
      .from('user_stats')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .order('total_xp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((entry, index) => ({
      user_id: entry.user_id,
      full_name: entry.profiles.full_name,
      avatar_url: entry.profiles.avatar_url,
      total_xp: entry.total_xp,
      level: entry.level,
      streak_days: entry.streak_days,
      badges_earned: entry.badges_earned,
      rank: index + 1,
    })) as LeaderboardEntry[];
  },

  async getWeeklyLeaderboard(limit: number = 100) {
    const { data, error } = await supabase
      .from('weekly_stats')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .order('weekly_xp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((entry, index) => ({
      user_id: entry.user_id,
      full_name: entry.profiles.full_name,
      avatar_url: entry.profiles.avatar_url,
      total_xp: entry.weekly_xp,
      level: entry.level,
      streak_days: entry.streak_days,
      badges_earned: entry.badges_earned,
      rank: index + 1,
    })) as LeaderboardEntry[];
  },

  async getUserRank(userId: string) {
    const { data, error } = await supabase
      .rpc('get_user_rank', { user_id_param: userId });

    if (error) throw error;
    return data;
  },

  async getAllBadges() {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('rarity', { ascending: true });

    if (error) throw error;
    return data as Badge[];
  },

  async getUserBadges(userId: string) {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badges (*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async awardBadge(userId: string, badgeId: string) {
    const { data, error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId,
      })
      .select(`
        *,
        badges (*)
      `)
      .single();

    if (error) throw error;

    const badge = data.badges as Badge;
    const { error: xpError } = await supabase.rpc('add_xp', {
      user_id_param: userId,
      xp_amount: badge.xp_reward,
    });

    if (xpError) throw xpError;

    return data;
  },

  async checkBadgeCriteria(userId: string) {
    const badges = await this.getAllBadges();
    const userBadges = await this.getUserBadges(userId);
    const earnedBadgeIds = userBadges.map(ub => ub.badge_id);

    const eligibleBadges: Badge[] = [];

    for (const badge of badges) {
      if (earnedBadgeIds.includes(badge.id)) continue;

      const meetsRequirements = await this.evaluateBadgeCriteria(userId, badge.criteria);
      if (meetsRequirements) {
        eligibleBadges.push(badge);
      }
    }

    return eligibleBadges;
  },

  async evaluateBadgeCriteria(userId: string, criteria: Record<string, any>) {
    const stats = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!stats.data) return false;

    for (const [key, value] of Object.entries(criteria)) {
      if (stats.data[key] < value) {
        return false;
      }
    }

    return true;
  },

  async getTopStreaks(limit: number = 10) {
    const { data, error } = await supabase
      .from('user_stats')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .order('streak_days', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },
};
