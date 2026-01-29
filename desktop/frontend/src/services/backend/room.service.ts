import { supabase } from './auth.service';

export interface Room {
  id: string;
  name: string;
  subject: string;
  description: string;
  owner_id: string;
  is_private: boolean;
  is_live: boolean;
  max_members?: number;
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  room_id: string;
  user_id: string;
  joined_at: string;
  is_active: boolean;
  last_seen: string;
}

export interface CreateRoomData {
  name: string;
  subject: string;
  description: string;
  owner_id: string;
  is_private?: boolean;
  max_members?: number;
}

export const roomService = {
  async createRoom(data: CreateRoomData) {
    const { data: room, error } = await supabase
      .from('rooms')
      .insert({
        ...data,
        is_live: false,
      })
      .select()
      .single();

    if (error) throw error;

    await this.joinRoom(room.id, data.owner_id);

    return room as Room;
  },

  async getRooms(filters?: { subject?: string; is_private?: boolean }) {
    let query = supabase
      .from('rooms')
      .select(`
        *,
        room_members (
          user_id,
          is_active
        )
      `);

    if (filters?.subject) {
      query = query.eq('subject', filters.subject);
    }

    if (filters?.is_private !== undefined) {
      query = query.eq('is_private', filters.is_private);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async getRoom(roomId: string) {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        room_members (
          user_id,
          is_active,
          profiles (
            full_name,
            avatar_url
          )
        )
      `)
      .eq('id', roomId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateRoom(roomId: string, updates: Partial<Room>) {
    const { data, error } = await supabase
      .from('rooms')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomId)
      .select()
      .single();

    if (error) throw error;
    return data as Room;
  },

  async deleteRoom(roomId: string) {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);

    if (error) throw error;
  },

  async joinRoom(roomId: string, userId: string) {
    const { data, error } = await supabase
      .from('room_members')
      .insert({
        room_id: roomId,
        user_id: userId,
        is_active: true,
        last_seen: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async leaveRoom(roomId: string, userId: string) {
    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async updateMemberStatus(roomId: string, userId: string, isActive: boolean) {
    const { error } = await supabase
      .from('room_members')
      .update({
        is_active: isActive,
        last_seen: new Date().toISOString(),
      })
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async getRoomMembers(roomId: string) {
    const { data, error } = await supabase
      .from('room_members')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url,
          role
        )
      `)
      .eq('room_id', roomId);

    if (error) throw error;
    return data;
  },

  async getUserRooms(userId: string) {
    const { data, error } = await supabase
      .from('room_members')
      .select(`
        room_id,
        rooms (
          *,
          room_members (count)
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  },

  async setRoomLiveStatus(roomId: string, isLive: boolean) {
    return this.updateRoom(roomId, { is_live: isLive });
  },
};
