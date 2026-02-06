import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  role: 'student' | 'parent' | 'teacher';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', { email, password });
    api.setToken(response.token);
    return response;
  },

  async signup(email: string, password: string, name: string, age: number, role: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/signup', { 
      email, 
      password, 
      name, 
      age, 
      role 
    });
    api.setToken(response.token);
    return response;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } finally {
      api.clearToken();
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ user: User }>('/api/auth/me');
    return response.user;
  },

  isAuthenticated(): boolean {
    return !!api.getToken();
  },
};

export default authService;
