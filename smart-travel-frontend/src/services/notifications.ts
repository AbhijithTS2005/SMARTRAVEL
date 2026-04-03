import api from './api';

export interface Notification {
  id: string;
  type: string;
  data: {
    title?: string;
    message?: string;
    type?: string;
    destination_name?: string;
    alert_type?: string;
    severity?: string;
    [key: string]: unknown;
  };
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedNotifications {
  current_page: number;
  data: Notification[];
  last_page: number;
  per_page: number;
  total: number;
}

export const notificationsService = {
  getAll: async (page = 1): Promise<PaginatedNotifications> => {
    const response = await api.get(`/notifications?page=${page}`);
    return response.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    return response.data.data.unread_count;
  },

  markAsRead: async (id: string) => {
    const response = await api.post(`/notifications/${id}/mark-as-read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark-all-as-read');
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};
