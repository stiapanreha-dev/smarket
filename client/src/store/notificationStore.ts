import { create } from 'zustand';
import { apiClient } from '@/api/axios.config';

export enum NotificationType {
  ORDER_UPDATE = 'ORDER_UPDATE',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  SHIPPING_UPDATE = 'SHIPPING_UPDATE',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  PROMO = 'PROMO',
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  related_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadNotifications: (params?: { unread?: boolean; type?: NotificationType; page?: number; limit?: number }) => Promise<void>;
  loadRecentNotifications: () => Promise<void>;
  getUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  reset: () => void;
}

const API_BASE = '/notifications';

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  loadNotifications: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(API_BASE, { params });
      set({
        notifications: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load notifications',
        isLoading: false,
      });
    }
  },

  loadRecentNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`${API_BASE}/recent`);
      set({
        notifications: response.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load notifications',
        isLoading: false,
      });
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await apiClient.get(`${API_BASE}/unread-count`);
      set({ unreadCount: response.data.count });
    } catch (error: any) {
      console.error('Failed to get unread count:', error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await apiClient.patch(`${API_BASE}/${notificationId}/read`);

      // Update local state
      const { notifications, unreadCount } = get();
      const updatedNotifications = notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      );
      const notification = notifications.find((n) => n.id === notificationId);
      const newUnreadCount = notification && !notification.is_read ? unreadCount - 1 : unreadCount;

      set({
        notifications: updatedNotifications,
        unreadCount: Math.max(0, newUnreadCount),
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to mark notification as read' });
    }
  },

  markAllAsRead: async () => {
    try {
      await apiClient.patch(`${API_BASE}/read-all`);

      // Update local state
      const { notifications } = get();
      const updatedNotifications = notifications.map((n) => ({
        ...n,
        is_read: true,
        read_at: new Date().toISOString(),
      }));

      set({
        notifications: updatedNotifications,
        unreadCount: 0,
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to mark all notifications as read' });
    }
  },

  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
    });
  },
}));
