import api from './api';
import type { Destination } from '@/types';

export interface DestinationFilters {
  district?: string;
  min_budget?: number;
  max_budget?: number;
  travel_types?: string[];
  climate?: string;
  sort?: 'match_score' | 'aqi' | 'budget';
  page?: number;
  limit?: number;
}

export interface DestinationsResponse {
  success: boolean;
  data: Destination[];
  meta?: {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
  };
}

// Actual API response structure from backend
// Using any[] because backend returns destinations with dynamic runtime fields
interface DestinationsAPIResponse {
  success: boolean;
  message: string;
  data: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    destinations: any[];
    pagination: {
      current_page: number;
      total: number;
      per_page: number;
      last_page: number;
      from: number | null;
      to: number | null;
    };
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters_applied: Record<string, any>;
}

export const destinationsService = {
  /**
   * Get all destinations with optional filters
   */
  async getDestinations(filters?: DestinationFilters): Promise<DestinationsAPIResponse> {
    const params = new URLSearchParams();
    
    if (filters?.district) params.append('district', filters.district);
    if (filters?.min_budget) params.append('min_budget', filters.min_budget.toString());
    if (filters?.max_budget) params.append('max_budget', filters.max_budget.toString());
    if (filters?.travel_types?.length) params.append('travel_types', filters.travel_types.join(','));
    if (filters?.climate) params.append('climate', filters.climate);
    
    // Map frontend sort to backend sort_by
    if (filters?.sort) {
      const sortMap: Record<string, string> = {
        match_score: 'popularity_score',
        aqi: 'name', // Backend doesn't have AQI sort, use name
        budget: 'avg_budget_min',
      };
      params.append('sort_by', sortMap[filters.sort] || 'popularity_score');
    }
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('per_page', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/destinations?${queryString}` : '/destinations';
    
    const response = await api.get<DestinationsAPIResponse>(url);
    
    // Backend returns: { success: true, data: { destinations: [...], pagination: {...} } }
    return response.data;
  },

  /**
   * Get single destination by ID (includes live weather, tips, alerts)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getDestination(id: number): Promise<any> {
    const response = await api.get(`/destinations/${id}`);
    return response.data;
  },

  /**
   * Get destination analysis (suitability breakdown)
   */
  async getDestinationAnalysis(id: number) {
    const response = await api.get(`/intelligence/analyze/${id}`);
    return response.data.data;
  },

  /**
   * Get alternative destinations
   */
  async getAlternatives(id: number) {
    const response = await api.get(`/intelligence/alternatives/${id}`);
    return response.data.data;
  },

  /**
   * Get unique districts for filter dropdown
   */
  async getDistricts(): Promise<string[]> {
    const response = await api.get('/destinations-stats');
    return response.data.districts || [];
  },

  /**
   * Get photos for a destination from Pexels API
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getDestinationPhotos(id: number): Promise<any> {
    const response = await api.get(`/destinations/${id}/photos`);
    return response.data.data;
  },

  /**
   * Get "People Also Like" recommendations for a destination
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getPeopleAlsoLike(id: number): Promise<any[]> {
    const response = await api.get(`/recommendations/people-also-like/${id}`);
    return response.data.data || [];
  },

  /**
   * Get nearby recommendations for a destination
   * Returns matching destinations or nearby attractions based on preference match
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getNearbyRecommendations(id: number): Promise<any> {
    const response = await api.get(`/recommendations/nearby/${id}`);
    return response.data.data;
  },
};
