import { supabase } from '../backend/auth.service';

export interface StudyRecommendation {
  topic: string;
  subject: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  estimatedTime: number;
  resources?: Array<{
    title: string;
    type: string;
    url?: string;
  }>;
}

export interface ResourceRecommendation {
  title: string;
  description: string;
  type: 'video' | 'article' | 'book' | 'practice' | 'course';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  url?: string;
  relevanceScore: number;
}

export interface LearningPathRecommendation {
  steps: Array<{
    order: number;
    title: string;
    description: string;
    estimatedDuration: string;
    prerequisites?: string[];
  }>;
  totalDuration: string;
  difficulty: string;
}

export const recommendationService = {
  async getStudyRecommendations(userId: string): Promise<StudyRecommendation[]> {
    const userStats = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const recentActivity = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    const goals = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false);

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-recommend-study`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userStats: userStats.data,
        recentActivity: recentActivity.data,
        goals: goals.data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get study recommendations');
    }

    const data = await response.json();
    return data.recommendations;
  },

  async getResourceRecommendations(
    topic: string,
    subject: string,
    userLevel?: number
  ): Promise<ResourceRecommendation[]> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-recommend-resources`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        topic,
        subject,
        userLevel,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get resource recommendations');
    }

    const data = await response.json();
    return data.resources;
  },

  async getLearningPath(
    goal: string,
    currentLevel: 'beginner' | 'intermediate' | 'advanced',
    timeAvailable?: number
  ): Promise<LearningPathRecommendation> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-learning-path`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        goal,
        currentLevel,
        timeAvailable,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get learning path');
    }

    const data = await response.json();
    return data.learningPath;
  },

  async getPersonalizedSchedule(userId: string, weekGoalHours: number): Promise<any> {
    const userStats = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const goals = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false);

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-schedule`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userStats: userStats.data,
        goals: goals.data,
        weekGoalHours,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate schedule');
    }

    const data = await response.json();
    return data.schedule;
  },

  async getNextBestAction(userId: string): Promise<{
    action: string;
    reason: string;
    estimatedTime: number;
  }> {
    const recommendations = await this.getStudyRecommendations(userId);

    if (recommendations.length === 0) {
      return {
        action: 'Review your study goals and set new objectives',
        reason: 'No pending study tasks found',
        estimatedTime: 15,
      };
    }

    const highPriority = recommendations.filter(r => r.priority === 'high');
    const nextAction = highPriority[0] || recommendations[0];

    return {
      action: `Study ${nextAction.topic} in ${nextAction.subject}`,
      reason: nextAction.reason,
      estimatedTime: nextAction.estimatedTime,
    };
  },

  async getWeakAreasAnalysis(userId: string): Promise<Array<{
    subject: string;
    weakAreas: string[];
    improvement: string;
    resources: ResourceRecommendation[];
  }>> {
    const activityLogs = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-analyze-weak-areas`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        activityLogs: activityLogs.data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze weak areas');
    }

    const data = await response.json();
    return data.analysis;
  },
};
