import api from './api';

export interface Report {
  id: string;
  user_id: string;
  title: string;
  type: string;
  content: string;
  period_start?: string;
  period_end?: string;
  created_at: string;
}

export const reportService = {
  async generateReport(type: string, periodStart?: string, periodEnd?: string): Promise<Report> {
    return api.post<Report>('/api/reports/generate', {
      type,
      period_start: periodStart,
      period_end: periodEnd,
    });
  },

  async getReports(): Promise<Report[]> {
    return api.get<Report[]>('/api/reports');
  },

  async getReport(reportId: string): Promise<Report> {
    return api.get<Report>(`/api/reports/${reportId}`);
  },
};

export default reportService;
