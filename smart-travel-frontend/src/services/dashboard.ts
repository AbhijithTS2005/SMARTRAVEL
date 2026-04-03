import api from './api';
import type { Recommendation, UserPreferences } from '@/types';

export interface DashboardData {
  has_preferences: boolean;
  for_you: Recommendation[];
  travelers_like_you: Recommendation[];
  recent_plans: Recommendation[];
}

export const dashboardService = {
  /**
   * Get all 3 dashboard recommendation sections
   */
  async getDashboard(): Promise<DashboardData> {
    const response = await api.get('/dashboard');
    return response.data.data;
  },

  /**
   * Get quick stats for dashboard
   */
  async getStats() {
    const response = await api.get('/destinations-stats');
    return response.data;
  },

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<UserPreferences | null> {
    try {
      const response = await api.get('/preferences');
      return response.data.data || null;
    } catch {
      // User might not have preferences yet
      return null;
    }
  },
};
