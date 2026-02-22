import api from './api';

export interface StudyPlan {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  progress: number;
  due_date?: string;
  start_date?: string;
  end_date?: string;
  daily_goal_hours?: number;
  is_challenge?: boolean;
  is_public?: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  study_plan_id: string;
  name: string;
  description?: string;
  progress: number;
}

export interface ScheduleBlock {
  id: string;
  study_plan_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string;
  topic: string;
  block_type: string;
}

export const studyPlanService = {
  async getMyStudyPlans(): Promise<StudyPlan[]> {
    return api.get<StudyPlan[]>('/api/studyplans');
  },

  async getPublicStudyPlans(): Promise<StudyPlan[]> {
    return api.get<StudyPlan[]>('/api/studyplans/public');
  },

  async createStudyPlan(data: Partial<StudyPlan>): Promise<StudyPlan> {
    return api.post<StudyPlan>('/api/studyplans', data);
  },

  async getCourses(studyPlanId: string): Promise<Course[]> {
    return api.get<Course[]>(`/api/studyplans/${studyPlanId}/courses`);
  },

  async addCourse(studyPlanId: string, course: Partial<Course>): Promise<Course> {
    return api.post<Course>(`/api/studyplans/${studyPlanId}/courses`, course);
  },

  async getScheduleBlocks(studyPlanId: string): Promise<ScheduleBlock[]> {
    return api.get<ScheduleBlock[]>(`/api/studyplans/${studyPlanId}/schedule`);
  },

  async createScheduleBlock(studyPlanId: string, block: Partial<ScheduleBlock>): Promise<ScheduleBlock> {
    return api.post<ScheduleBlock>(`/api/studyplans/${studyPlanId}/schedule`, block);
  },

  async updateScheduleBlock(studyPlanId: string, blockId: string, block: Partial<ScheduleBlock>): Promise<ScheduleBlock> {
    return api.put<ScheduleBlock>(`/api/studyplans/${studyPlanId}/schedule/${blockId}`, block);
  },

  async updateProgress(studyPlanId: string, progress: number): Promise<void> {
    await api.put(`/api/studyplans/${studyPlanId}/progress`, { progress });
  },

  async getFullSchedule(): Promise<ScheduleBlock[]> {
    return api.get<ScheduleBlock[]>('/api/schedule');
  },

  async getUserSchedule(): Promise<ScheduleBlock[]> {
    return api.get<ScheduleBlock[]>('/api/users/me/schedule');
  },

  async getStudyPlan(studyPlanId: string): Promise<StudyPlan> {
    return api.get<StudyPlan>(`/api/studyplans/${studyPlanId}`);
  },

  async updateStudyPlanProgress(studyPlanId: string, progress: number): Promise<void> {
    await api.put(`/api/studyplans/${studyPlanId}/progress`, { progress });
  },
};

export default studyPlanService;
