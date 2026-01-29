import { supabase } from './auth.service';

export interface Resource {
  id: string;
  room_id: string;
  uploader_id: string;
  name: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: 'document' | 'video' | 'audio' | 'image' | 'other';
  created_at: string;
}

export interface CreateResourceData {
  room_id: string;
  uploader_id: string;
  name: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: 'document' | 'video' | 'audio' | 'image' | 'other';
}

export const resourceService = {
  async uploadFile(file: File, roomId: string, userId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `room-resources/${roomId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async createResource(data: CreateResourceData) {
    const { data: resource, error } = await supabase
      .from('resources')
      .insert(data)
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return resource;
  },

  async getResources(roomId: string) {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getResource(resourceId: string) {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('id', resourceId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteResource(resourceId: string) {
    const resource = await this.getResource(resourceId);
    if (!resource) throw new Error('Resource not found');

    const filePath = resource.file_url.split('/').slice(-3).join('/');

    const { error: deleteFileError } = await supabase.storage
      .from('resources')
      .remove([filePath]);

    if (deleteFileError) throw deleteFileError;

    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId);

    if (error) throw error;
  },

  async getResourcesByCategory(roomId: string, category: string) {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('room_id', roomId)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async searchResources(roomId: string, query: string) {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('room_id', roomId)
      .ilike('name', `%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};
