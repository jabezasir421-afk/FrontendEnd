import { api } from './client';
import type {
  NotificationResponse,
  NotificationPreferenceResponse,
  UpdateNotificationPreferenceRequest,
  Page
} from '$lib/types/api';

export const notificationsApi = {
  getAll: (page = 0, size = 20, sort = 'createdAt', direction = 'desc') =>
    api.get<Page<NotificationResponse>>('/notifications', {
      params: { page, size, sort: `${sort},${direction}` }
    }),

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<{ count: number }>('/notifications/unread-count');
    return res?.count ?? 0;
  },

  markAsRead: (id: string) =>
    api.put<void>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put<void>('/notifications/read-all'),

  getPreferences: () =>
    api.get<NotificationPreferenceResponse>('/notifications/preferences'),

  updatePreferences: (data: UpdateNotificationPreferenceRequest) =>
    api.put<NotificationPreferenceResponse>('/notifications/preferences', data)
};
