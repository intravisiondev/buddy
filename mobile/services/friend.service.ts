import api from './api';

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  name: string;
  avatar_url?: string;
  status: 'online' | 'offline' | 'away';
}

export interface FriendRequest {
  id: string;
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export const friendService = {
  async getFriends(): Promise<Friend[]> {
    return api.get<Friend[]>('/api/friends');
  },

  async getIncomingRequests(): Promise<FriendRequest[]> {
    return api.get<FriendRequest[]>('/api/friends/requests/incoming');
  },

  async sendFriendRequest(toUserId: string): Promise<void> {
    await api.post('/api/friends/requests', { to_user_id: toUserId });
  },

  async acceptFriendRequest(requestId: string): Promise<void> {
    await api.post(`/api/friends/requests/${requestId}/accept`);
  },

  async rejectFriendRequest(requestId: string): Promise<void> {
    await api.post(`/api/friends/requests/${requestId}/reject`);
  },
};

export default friendService;
