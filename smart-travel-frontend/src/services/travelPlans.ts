import api from './api';

export interface TravelPlan {
  id: number;
  user_id: number;
  destination_id: number | null;
  custom_location_name: string | null;
  custom_latitude: number | null;
  custom_longitude: number | null;
  start_date: string;
  end_date: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  monitoring_active: boolean;
  created_at: string;
  updated_at: string;
  destination?: {
    id: number;
    name: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
    image_url?: string;
  } | null;
}

export interface CreateTravelPlanData {
  destination_id?: number;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  start_date: string;
  end_date: string;
}

export const travelPlansService = {
  getAll: async (): Promise<TravelPlan[]> => {
    const response = await api.get('/travel-plans');
    return response.data.data;
  },

  create: async (data: CreateTravelPlanData) => {
    const response = await api.post('/travel-plans', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/travel-plans/${id}`);
    return response.data;
  },

  complete: async (id: number) => {
    const response = await api.post(`/travel-plans/${id}/complete`);
    return response.data;
  },

  toggleMonitoring: async (id: number) => {
    const response = await api.post(`/travel-plans/${id}/toggle-monitoring`);
    return response.data;
  },
};
