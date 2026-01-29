import { supabase } from './auth.service';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  subject?: string;
  target_value: number;
  current_value: number;
  unit: 'hours' | 'problems' | 'chapters' | 'quizzes' | 'custom';
  due_date?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: 'study' | 'quiz' | 'assignment' | 'challenge' | 'room_join' | 'badge_earned';
  description: string;
  subject?: string;
  duration_minutes?: number;
  score?: number;
  xp_earned: number;
  created_at: string;
}

export interface DailyProgress {
  date: string;
  study_hours: number;
  xp_earned: number;
  goals_completed: number;
  activities_count: number;
}

export const progressService = {
  async createGoal(userId: string, goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_completed' | 'current_value'>) {
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        ...goal,
        current_value: 0,
        is_completed: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Goal;
  },

  async getGoals(userId: string, filters?: { is_completed?: boolean }) {
    let query = supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    if (filters?.is_completed !== undefined) {
      query = query.eq('is_completed', filters.is_completed);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as Goal[];
  },

  async updateGoalProgress(goalId: string, currentValue: number) {
    const { data: goal, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (fetchError) throw fetchError;

    const isCompleted = currentValue >= goal.target_value;

    const { data, error } = await supabase
      .from('goals')
      .update({
        current_value: currentValue,
        is_completed: isCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data as Goal;
  },

  async deleteGoal(goalId: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;
  },

  async logActivity(activity: Omit<ActivityLog, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert(activity)
      .select()
      .single();

    if (error) throw error;

    if (activity.xp_earned > 0) {
      await supabase.rpc('add_xp', {
        user_id_param: activity.user_id,
        xp_amount: activity.xp_earned,
      });
    }

    return data as ActivityLog;
  },

  async getActivityLogs(userId: string, limit: number = 50, offset: number = 0) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data as ActivityLog[];
  },

  async getDailyProgress(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .rpc('get_daily_progress', {
        user_id_param: userId,
        start_date_param: startDate,
        end_date_param: endDate,
      });

    if (error) throw error;
    return data as DailyProgress[];
  },

  async getWeeklyProgress(userId: string) {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

    return this.getDailyProgress(
      userId,
      startOfWeek.toISOString().split('T')[0],
      endOfWeek.toISOString().split('T')[0]
    );
  },

  async getSubjectProgress(userId: string) {
    const { data, error } = await supabase
      .rpc('get_subject_progress', {
        user_id_param: userId,
      });

    if (error) throw error;
    return data;
  },

  async updateStreak(userId: string) {
    const { data, error } = await supabase.rpc('update_streak', {
      user_id_param: userId,
    });

    if (error) throw error;
    return data;
  },

  async checkStreakStatus(userId: string) {
    const { data, error } = await supabase.rpc('check_streak_status', {
      user_id_param: userId,
    });

    if (error) throw error;
    return data;
  },
};
