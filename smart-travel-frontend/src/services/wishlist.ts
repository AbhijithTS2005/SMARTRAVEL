import api from './api';

export interface WishlistItem {
  id: number;
  destination: {
    id: number;
    name: string;
    slug: string;
    district: string;
    primary_type: string;
    images: string[];
    avg_budget_min: number;
    avg_budget_max: number;
    popularity_score: number;
  };
  added_at: string;
}

export const wishlistService = {
  async getAll(): Promise<WishlistItem[]> {
    const response = await api.get('/wishlist');
    return response.data.data || [];
  },

  async toggle(destinationId: number): Promise<{ wishlisted: boolean; message: string }> {
    const response = await api.post('/wishlist/toggle', { destination_id: destinationId });
    return response.data;
  },

  async check(destinationId: number): Promise<boolean> {
    const response = await api.get(`/wishlist/check/${destinationId}`);
    return response.data.wishlisted;
  },
};
