import api from './api';

export interface Room {
  id: string;
  name: string;
  subject: string;
  description: string;
  owner_id: string;
  is_private: boolean;
  max_members: number;
  is_live: boolean;
  syllabus?: any;
  exam_dates?: any[];
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  content: string;
  message_type: string;
  created_at: string;
}

export interface RoomMember {
  user_id: string;
  name: string;
  role: string;
  joined_at: string;
}

export const roomService = {
  async getRooms(subject?: string): Promise<Room[]> {
    const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
    return api.get<Room[]>(`/api/rooms${query}`);
  },

  async getMyRooms(subject?: string): Promise<Room[]> {
    const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
    return api.get<Room[]>(`/api/rooms/my${query}`);
  },

  async getRoom(roomId: string): Promise<Room> {
    return api.get<Room>(`/api/rooms/${roomId}`);
  },

  async createRoom(
    name: string,
    subject: string,
    description: string,
    syllabus: any,
    isPrivate: boolean,
    maxMembers: number
  ): Promise<Room> {
    return api.post<Room>('/api/rooms', {
      name,
      subject,
      description,
      syllabus,
      is_private: isPrivate,
      max_members: maxMembers,
    });
  },

  async joinRoom(roomId: string): Promise<void> {
    await api.post(`/api/rooms/${roomId}/join`);
  },

  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    return api.get<RoomMember[]>(`/api/rooms/${roomId}/members`);
  },

  async getMessages(roomId: string): Promise<Message[]> {
    return api.get<Message[]>(`/api/rooms/${roomId}/messages`);
  },

  async sendMessage(roomId: string, content: string): Promise<Message> {
    return api.post<Message>(`/api/rooms/${roomId}/messages`, { content });
  },

  async updateSyllabus(roomId: string, syllabus: any): Promise<void> {
    await api.put(`/api/rooms/${roomId}/syllabus`, { syllabus });
  },

  async updateExamDates(roomId: string, examDates: any[]): Promise<void> {
    await api.put(`/api/rooms/${roomId}/exam-dates`, { exam_dates: examDates });
  },

  async checkMembership(roomId: string): Promise<{ is_member: boolean }> {
    return api.get(`/api/rooms/${roomId}/membership`);
  },
};

export default roomService;
