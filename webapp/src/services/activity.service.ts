import api from './api';

export interface StudySession {
  id: string;
  user_id: string;
  study_plan_id?: string;
  subject: string;
  start_time: string;
  last_active_time: string;
  is_idle: boolean;
  total_study_seconds: number;
  breaks: Array<{
    start_time: string;
    end_time?: string;
    duration_seconds: number;
  }>;
}

export interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  subject?: string;
  duration_minutes?: number;
  xp_earned?: number;
  created_at: string;
}

export const activityService = {
  async getMyActivity(): Promise<Activity[]> {
    return api.get<Activity[]>('/api/users/me/activity');
  },

  async logStudySession(data: {
    subject: string;
    duration_minutes: number;
    notes?: string;
    focus_score?: number;
  }): Promise<Activity> {
    return api.post<Activity>('/api/users/me/study-session', data);
  },

  async startStudySession(studyPlanId: string, subject: string): Promise<StudySession> {
    return api.post<StudySession>('/api/users/me/study-session/start', {
      study_plan_id: studyPlanId || undefined,
      subject,
    });
  },

  async getActiveStudySession(): Promise<StudySession | null> {
    try {
      return await api.get<StudySession>('/api/users/me/study-session/active');
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  },

  async pauseStudySession(): Promise<void> {
    await api.put('/api/users/me/study-session/pause');
  },

  async resumeStudySession(): Promise<void> {
    await api.put('/api/users/me/study-session/resume');
  },

  async setIdleStatus(isIdle: boolean): Promise<void> {
    await api.put('/api/users/me/study-session/idle', { is_idle: isIdle });
  },

  async stopStudySession(notes: string, focusScore: number): Promise<Activity> {
    return api.post<Activity>('/api/users/me/study-session/stop', {
      notes,
      focus_score: focusScore,
    });
  },
};

export default activityService;
