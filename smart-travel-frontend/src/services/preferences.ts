import api from './api';

export interface PreferenceData {
  travel_types: string[];
  climate_preference: string; // Changed from preferred_climate to match backend
  min_budget: number;
  max_budget: number;
  preferred_min_temp: number;
  preferred_max_temp: number;
  crowd_preference: string;
  air_quality_sensitive: boolean;
}

export const preferencesService = {
  /**
   * Save user preferences
   */
  async savePreferences(data: PreferenceData) {
    const response = await api.post('/preferences', data);
    return response.data;
  },

  /**
   * Get user preferences
   */
  async getPreferences() {
    const response = await api.get('/preferences');
    return response.data.data;
  },

  /**
   * Update preferences
   */
  async updatePreferences(data: Partial<PreferenceData>) {
    const response = await api.put('/preferences', data);
    return response.data;
  },
};
