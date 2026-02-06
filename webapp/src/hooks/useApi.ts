import { useEffect, useState, useCallback } from 'react';
import { authService } from '../services/auth.service';
import type { User } from '../services/auth.service';
import { roomService } from '../services/room.service';
import type { Room, Message } from '../services/room.service';
import { userService } from '../services/user.service';
import type { DashboardStats } from '../services/user.service';
import { goalService } from '../services/goal.service';
import type { Goal } from '../services/goal.service';
import { studyPlanService } from '../services/studyplan.service';
import type { StudyPlan } from '../services/studyplan.service';
import { friendService } from '../services/friend.service';
import type { Friend, FriendRequest } from '../services/friend.service';

export type { User } from '../services/auth.service';
export type { Room, Message } from '../services/room.service';
export type { DashboardStats } from '../services/user.service';
export type { Goal, Milestone } from '../services/goal.service';
export type { StudyPlan } from '../services/studyplan.service';

export interface Challenge {
  id: string;
  title: string;
  participants: number;
  ends_in: string;
  reward: string;
}

// Auth Hook (replaces useWailsAuth)
export function useApiAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Token might be invalid, clear it
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, age: number, role: string) => {
    try {
      const response = await authService.signup(email, password, name, age, role);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    try {
      await authService.logout();
    } catch (error) {
      // Even if logout fails on server, user is already cleared
      throw error;
    }
  };

  return { user, loading, login, signup, logout };
}

// Rooms Hook (replaces useWailsRooms)
export function useApiRooms(subject: string = '', isTeacher: boolean = false) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRooms = useCallback(async (subjectFilter?: string) => {
    setLoading(true);
    try {
      const filter = subjectFilter !== undefined ? subjectFilter : subject;
      const data = isTeacher 
        ? await roomService.getMyRooms(filter) 
        : await roomService.getRooms(filter);
      setRooms(data || []);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [subject, isTeacher]);

  const createRoom = async (
    name: string,
    subject: string,
    description: string,
    syllabus: any,
    isPrivate: boolean,
    maxMembers: number
  ) => {
    try {
      const room = await roomService.createRoom(name, subject, description, syllabus, isPrivate, maxMembers);
      setRooms(prev => [...prev, room]);
      return room;
    } catch (error) {
      throw error;
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      await roomService.joinRoom(roomId);
    } catch (error) {
      throw error;
    }
  };

  return { rooms, loading, loadRooms, createRoom, joinRoom };
}

// Messages Hook (replaces useWailsMessages)
export function useApiMessages(roomId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!roomId) return;
    
    setLoading(true);
    try {
      const data = await roomService.getMessages(roomId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (roomId) {
      loadMessages();
    }
  }, [roomId, loadMessages]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!roomId) return;

    const interval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [roomId, loadMessages]);

  const sendMessage = async (content: string) => {
    if (!roomId) return;

    try {
      const message = await roomService.sendMessage(roomId, content);
      setMessages(prev => [...prev, message]);
      return message;
    } catch (error) {
      throw error;
    }
  };

  return { messages, loading, loadMessages, sendMessage };
}

// Dashboard Hook (replaces useWailsDashboard)
export function useApiDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, goalsData, plansData] = await Promise.all([
        userService.getMyStats().catch(() => null),
        goalService.getTodayGoals().catch(() => []),
        studyPlanService.getMyStudyPlans().catch(() => []),
      ]);

      setStats(statsData);
      setGoals(Array.isArray(goalsData) ? goalsData : []);
      setStudyPlans(Array.isArray(plansData) ? plansData : []);
      // Challenges might not have an endpoint, set empty for now
      setChallenges([]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setGoals([]);
      setStudyPlans([]);
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleGoal = async (goalId: string) => {
    try {
      await goalService.toggleGoalComplete(goalId);
      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
      ));
    } catch (error) {
      console.error('Failed to toggle goal:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return { stats, goals, studyPlans, challenges, loading, loadDashboardData, toggleGoal };
}

// User Profile Hook (replaces useWailsUserProfile)
export function useApiUserProfile() {
  const getUserProfile = async (userID: string) => {
    try {
      const profile = await userService.getUserProfile(userID);
      return profile;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  };

  const getUserStats = async (userID: string) => {
    try {
      const stats = await userService.getUserStats(userID);
      return stats;
    } catch (error) {
      console.error('Failed to get user stats:', error);
      throw error;
    }
  };

  return { getUserProfile, getUserStats };
}

// Friends Hook (replaces useWailsFriends)
export function useApiFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      const data = await friendService.getFriends();
      setFriends(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load friends:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadIncomingRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await friendService.getIncomingRequests();
      setIncomingRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load incoming requests:', error);
      setIncomingRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendFriendRequest = async (toUserID: string) => {
    try {
      await friendService.sendFriendRequest(toUserID);
      return true;
    } catch (error) {
      console.error('Failed to send friend request:', error);
      throw error;
    }
  };

  const acceptFriendRequest = async (requestID: string) => {
    try {
      await friendService.acceptFriendRequest(requestID);
      await loadFriends();
      await loadIncomingRequests();
      return true;
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      throw error;
    }
  };

  const rejectFriendRequest = async (requestID: string) => {
    try {
      await friendService.rejectFriendRequest(requestID);
      await loadIncomingRequests();
      return true;
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      throw error;
    }
  };

  return {
    friends,
    incomingRequests,
    loading,
    loadFriends,
    loadIncomingRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  };
}
