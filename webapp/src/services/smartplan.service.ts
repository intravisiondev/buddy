import api from './api';

export interface SmartPlanInput {
  goals: string[];
  available_hours_per_week: number;
  subjects: string[];
  exam_dates?: Array<{ subject: string; date: string }>;
  preferences?: {
    preferred_study_times?: string[];
    break_frequency?: number;
  };
}

export interface SmartPlanSuggestion {
  id: string;
  name: string;
  description: string;
  schedule: any[];
  milestones: any[];
  estimated_completion: string;
}

export const smartPlanService = {
  async generateSmartPlan(input: SmartPlanInput): Promise<SmartPlanSuggestion> {
    return api.post<SmartPlanSuggestion>('/api/smart-plan/generate', input);
  },

  async createFromSmartPlan(suggestion: SmartPlanSuggestion): Promise<any> {
    return api.post('/api/smart-plan/create', suggestion);
  },

  async generateSmartStudyPlan(params: {
    subject: string;
    goals: string;
    description: string;
    weekly_hours: number;
    start_date: string;
    end_date: string;
  }): Promise<any> {
    return api.post('/api/smart-plan/generate', params);
  },

  async createSmartStudyPlan(plan: any): Promise<any> {
    return api.post('/api/smart-plan/create', plan);
  },
};

export default smartPlanService;
