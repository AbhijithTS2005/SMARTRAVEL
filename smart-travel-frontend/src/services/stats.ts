import api from './api';

export interface UserStats {
  overview: {
    total_trips: number;
    trips_completed: number;
    trips_planned: number;
    trips_active: number;
    destinations_viewed: number;
    destinations_wishlisted: number;
  };
  reviews: {
    reviews_written: number;
    avg_rating_given: number | null;
  };
  preferences: {
    favorite_type: string | null;
    favorite_district: string | null;
    districts_covered: string[];
    districts_covered_count: number;
  };
  interactions: Record<string, number>;
}

export const statsService = {
  async getStats(): Promise<UserStats> {
    const response = await api.get('/stats');
    return response.data.data;
  },
};
