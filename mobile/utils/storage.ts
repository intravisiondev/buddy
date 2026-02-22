import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: '@buddy:token',
  USER: '@buddy:user',
  THEME: '@buddy:theme',
  ROLE: '@buddy:role',
};

export const storage = {
  // Token management
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.TOKEN, token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.TOKEN);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  // User data
  async getUser(): Promise<any | null> {
    try {
      const userJson = await AsyncStorage.getItem(KEYS.USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  async setUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting user:', error);
    }
  },

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.USER);
    } catch (error) {
      console.error('Error removing user:', error);
    }
  },

  // Theme
  async getTheme(): Promise<'light' | 'dark' | null> {
    try {
      const theme = await AsyncStorage.getItem(KEYS.THEME);
      return theme as 'light' | 'dark' | null;
    } catch (error) {
      console.error('Error getting theme:', error);
      return null;
    }
  },

  async setTheme(theme: 'light' | 'dark'): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.THEME, theme);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  },

  // Role
  async getRole(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.ROLE);
    } catch (error) {
      console.error('Error getting role:', error);
      return null;
    }
  },

  async setRole(role: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.ROLE, role);
    } catch (error) {
      console.error('Error setting role:', error);
    }
  },

  async removeRole(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.ROLE);
    } catch (error) {
      console.error('Error removing role:', error);
    }
  },

  // Clear all
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER, KEYS.ROLE]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

export default storage;
