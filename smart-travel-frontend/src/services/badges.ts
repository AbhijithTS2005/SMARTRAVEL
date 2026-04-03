import api from './api';

export interface Badge {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  threshold: number;
  current: number;
  progress: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface BadgesResponse {
  badges: Badge[];
  total: number;
  unlocked: number;
  newly_unlocked: string[];
}

export const badgesService = {
  getAll: async (): Promise<BadgesResponse> => {
    const res = await api.get('/badges');
    return res.data;
  },
};
