import api from './api';

export interface Assignment {
  id: string;
  room_id: string;
  title: string;
  description?: string;
  due_date?: string;
  total_points?: number;
  created_by: string;
  created_at: string;
}

export const assignmentService = {
  async getRoomAssignments(roomId: string): Promise<Assignment[]> {
    return api.get<Assignment[]>(`/api/rooms/${roomId}/assignments`);
  },

  async getAssignment(assignmentId: string): Promise<Assignment> {
    return api.get<Assignment>(`/api/assignments/${assignmentId}`);
  },

  async createAssignment(roomId: string, assignment: Partial<Assignment>): Promise<Assignment> {
    return api.post<Assignment>(`/api/rooms/${roomId}/assignments`, assignment);
  },

  async updateAssignment(assignmentId: string, assignment: Partial<Assignment>): Promise<Assignment> {
    return api.put<Assignment>(`/api/assignments/${assignmentId}`, assignment);
  },

  async deleteAssignment(assignmentId: string): Promise<void> {
    await api.delete(`/api/assignments/${assignmentId}`);
  },
};

export default assignmentService;
