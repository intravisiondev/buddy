import { supabase } from './auth.service';

export interface StudyPlan {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  daily_goal_hours: number;
  is_challenge: boolean;
  is_public: boolean;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface StudyPlanCourse {
  id: string;
  study_plan_id: string;
  subject: string;
  hours_allocated: number;
  hours_completed: number;
}

export interface ScheduleBlock {
  id: string;
  study_plan_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string;
  topic: string;
  block_type: 'study' | 'practice' | 'review' | 'test';
}

export interface CreateStudyPlanData {
  user_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  daily_goal_hours: number;
  is_challenge?: boolean;
  is_public?: boolean;
}

export const studyPlanService = {
  async createStudyPlan(data: CreateStudyPlanData) {
    const { data: plan, error } = await supabase
      .from('study_plans')
      .insert({
        ...data,
        progress: 0,
        is_challenge: data.is_challenge || false,
        is_public: data.is_public || false,
      })
      .select()
      .single();

    if (error) throw error;
    return plan as StudyPlan;
  },

  async getStudyPlans(userId: string) {
    const { data, error } = await supabase
      .from('study_plans')
      .select(`
        *,
        study_plan_courses (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getStudyPlan(planId: string) {
    const { data, error } = await supabase
      .from('study_plans')
      .select(`
        *,
        study_plan_courses (*),
        schedule_blocks (*)
      `)
      .eq('id', planId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateStudyPlan(planId: string, updates: Partial<StudyPlan>) {
    const { data, error } = await supabase
      .from('study_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return data as StudyPlan;
  },

  async deleteStudyPlan(planId: string) {
    const { error } = await supabase
      .from('study_plans')
      .delete()
      .eq('id', planId);

    if (error) throw error;
  },

  async addCourse(planId: string, subject: string, hoursAllocated: number) {
    const { data, error } = await supabase
      .from('study_plan_courses')
      .insert({
        study_plan_id: planId,
        subject,
        hours_allocated: hoursAllocated,
        hours_completed: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCourseProgress(courseId: string, hoursCompleted: number) {
    const { data, error } = await supabase
      .from('study_plan_courses')
      .update({ hours_completed: hoursCompleted })
      .eq('id', courseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addScheduleBlock(block: Omit<ScheduleBlock, 'id'>) {
    const { data, error } = await supabase
      .from('schedule_blocks')
      .insert(block)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteScheduleBlock(blockId: string) {
    const { error } = await supabase
      .from('schedule_blocks')
      .delete()
      .eq('id', blockId);

    if (error) throw error;
  },

  async getPublicStudyPlans() {
    const { data, error } = await supabase
      .from('study_plans')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('is_public', true)
      .eq('is_challenge', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async joinChallenge(planId: string, userId: string) {
    const { data, error } = await supabase
      .from('study_plan_participants')
      .insert({
        study_plan_id: planId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getChallengeParticipants(planId: string) {
    const { data, error } = await supabase
      .from('study_plan_participants')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('study_plan_id', planId);

    if (error) throw error;
    return data;
  },
};
