import api from './api';

export interface ReviewItem {
  id: number;
  user: {
    id: number;
    name: string;
  };
  rating: number;
  comment: string | null;
  is_own: boolean;
  created_at: string;
}

export interface ReviewsResponse {
  reviews: ReviewItem[];
  average_rating: number | null;
  total_reviews: number;
}

export const reviewsService = {
  async getForDestination(destinationId: number): Promise<ReviewsResponse> {
    const response = await api.get(`/destinations/${destinationId}/reviews`);
    return response.data.data;
  },

  async submit(destinationId: number, rating: number, comment?: string): Promise<void> {
    await api.post(`/destinations/${destinationId}/reviews`, { rating, comment });
  },

  async remove(destinationId: number): Promise<void> {
    await api.delete(`/destinations/${destinationId}/reviews`);
  },
};
