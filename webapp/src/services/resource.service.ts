import api from './api';

export interface Resource {
  id: string;
  room_id: string;
  name: string;
  description?: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  category?: string;
  subject?: string;
  subjects?: string[];
  uploader_type?: string;
  uploader_id?: string;
  uploaded_by?: string;
  is_public?: boolean;
  created_at: string;
}

export const resourceService = {
  async getRoomResources(roomId: string): Promise<Resource[]> {
    return api.get<Resource[]>(`/api/rooms/${roomId}/resources`);
  },

  // Get resources with optional filters
  async getResources(roomId: string, uploaderType?: string, category?: string): Promise<Resource[]> {
    const params = new URLSearchParams();
    if (uploaderType) params.append('uploader_type', uploaderType);
    if (category && category !== 'all') params.append('category', category);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<Resource[]>(`/api/rooms/${roomId}/resources${query}`);
  },

  async getResource(resourceId: string): Promise<Resource> {
    return api.get<Resource>(`/api/resources/${resourceId}`);
  },

  async uploadResource(
    roomId: string,
    file: File,
    metadata: {
      name?: string;
      description?: string;
      category?: string;
      subject?: string;
      subjects?: string[];
    }
  ): Promise<Resource> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', metadata.name || file.name);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.category) formData.append('category', metadata.category);
    if (metadata.subject) formData.append('subject', metadata.subject);
    if (metadata.subjects) formData.append('subjects', JSON.stringify(metadata.subjects));
    
    return api.upload<Resource>(`/api/rooms/${roomId}/resources/upload`, formData);
  },

  async createResource(roomId: string, resource: Partial<Resource>): Promise<Resource> {
    return api.post<Resource>(`/api/rooms/${roomId}/resources`, resource);
  },

  async deleteResource(resourceId: string): Promise<void> {
    await api.delete(`/api/resources/${resourceId}`);
  },

  async shareResource(resourceId: string, targetRoomId: string): Promise<void> {
    await api.post(`/api/resources/${resourceId}/share`, { target_room_id: targetRoomId });
  },
};

export default resourceService;
