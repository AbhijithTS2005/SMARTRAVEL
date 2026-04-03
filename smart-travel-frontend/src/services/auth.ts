import api from './api';
import { storage } from '@/utils/storage';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/register', data);
    // Backend returns { success, message, data: { user, token } }
    return {
      success: response.data.success,
      message: response.data.message,
      token: response.data.data.token,
      user: response.data.data.user,
    };
  },

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/login', data);
    // Backend returns { success, message, data: { user, token } }
    return {
      success: response.data.success,
      message: response.data.message,
      token: response.data.data.token,
      user: response.data.data.user,
    };
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await api.post('/logout');
    storage.clear();
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const response = await api.get('/me');
    return response.data;
  },

  /**
   * Store auth data in localStorage
   */
  storeAuthData(token: string, user: { id: number; name: string; email: string }): void {
    storage.setToken(token);
    storage.setUser(user);
  },

  /**
   * Get stored auth token
   */
  getToken(): string | null {
    return storage.getToken();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
