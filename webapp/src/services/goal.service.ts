import api from './api';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  subject?: string;
  due_date?: string;
  completed: boolean;
  created_at: string;
}

export interface Milestone {
  id: string;
  study_plan_id?: string;
  user_id?: string;
  title: string;
  description?: string;
  target_date?: string;
  progress: number;
  completed?: boolean;
  created_at: string;
  completed_at?: string;
}

export const goalService = {
  async getGoals(): Promise<Goal[]> {
    return api.get<Goal[]>('/api/goals');
  },

  async getTodayGoals(): Promise<Goal[]> {
    return api.get<Goal[]>('/api/goals/today');
  },

  async createGoal(goal: Partial<Goal>): Promise<Goal> {
    return api.post<Goal>('/api/goals', goal);
  },

  async toggleGoalComplete(goalId: string): Promise<void> {
    await api.post(`/api/goals/${goalId}/toggle`);
  },

  async deleteGoal(goalId: string): Promise<void> {
    await api.delete(`/api/goals/${goalId}`);
  },

  async generateDailyGoals(): Promise<Goal[]> {
    return api.post<Goal[]>('/api/goals/daily/generate');
  },

  // Milestones
  async getMilestones(studyPlanId?: string): Promise<Milestone[]> {
    const query = studyPlanId ? `?study_plan_id=${studyPlanId}` : '';
    return api.get<Milestone[]>(`/api/milestones${query}`);
  },

  async createMilestone(milestone: Partial<Milestone>): Promise<Milestone> {
    return api.post<Milestone>('/api/milestones', milestone);
  },

  async updateMilestoneProgress(milestoneId: string, progress: number): Promise<void> {
    await api.put(`/api/milestones/${milestoneId}/progress`, { progress });
  },
};

export default goalService;
