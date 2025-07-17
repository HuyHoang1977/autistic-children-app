import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../../api/services/notification.service';
import type {
  Notification,
  NotificationResponse,
  NotificationCountResponse,
  GetNotificationsRequest,
} from '../../types/notification';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  // Actions
  loadNotifications: (params?: GetNotificationsRequest) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface UseNotificationCountReturn {
  unreadCount: number;
  loading: boolean;
  refreshUnreadCount: () => Promise<void>;
}

// Hook chính để quản lý toàn bộ notifications
export const useNotifications = (
  initialParams: GetNotificationsRequest = { limit: 20, offset: 0 }
): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [params, setParams] = useState<GetNotificationsRequest>(initialParams);

  // Load notifications
  const loadNotifications = useCallback(async (newParams?: GetNotificationsRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        setHasMore(false);
        return;
      }
      
      const requestParams = newParams || params;
      const response = await notificationService.getNotifications(requestParams);
      
      if (response.success && response.data) {
        if (requestParams.offset === 0) {
          // First load or refresh
          setNotifications(response.data);
        } else {
          // Load more
          setNotifications(prev => [...prev, ...response.data!]);
        }
        
        setUnreadCount(response.unread_count || 0);
        setHasMore(response.pagination?.has_more || false);
        setParams(requestParams);
      } else {
        setError(response.message || 'Failed to load notifications');
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [params]);

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    const newParams = {
      ...params,
      offset: notifications.length,
    };
    
    await loadNotifications(newParams);
  }, [hasMore, loading, params, notifications.length, loadNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.notification_id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationService.markAllAsRead();
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      
      if (response.success) {
        setNotifications(prev => {
          const deletedNotif = prev.find(n => n.notification_id === notificationId);
          const newNotifications = prev.filter(n => n.notification_id !== notificationId);
          
          // Update unread count if deleted notification was unread
          if (deletedNotif && !deletedNotif.is_read) {
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));
          }
          
          return newNotifications;
        });
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      
      if (response.success) {
        setUnreadCount(response.unread_count);
      }
    } catch (err) {
      console.error('Failed to refresh unread count:', err);
    }
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    await loadNotifications({ ...params, offset: 0 });
  }, [loadNotifications, params]);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, []);

  // Auto-refresh notifications and unread count every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUnreadCount();
      // Also refresh the notifications list to show new ones
      loadNotifications({ ...params, offset: 0 });
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount, loadNotifications, params]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    loadNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount,
    refresh,
  };
};

// Hook đơn giản chỉ để lấy unread count (lightweight version)
export const useNotificationCount = (): UseNotificationCountReturn => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setUnreadCount(0);
        return;
      }

      const response = await notificationService.getUnreadCount();
      
      if (response.success) {
        setUnreadCount(response.unread_count);
      }
    } catch (err) {
      console.error('Failed to refresh unread count:', err);
      // Don't show error in UI for notification count - just fail silently
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  return {
    unreadCount,
    loading,
    refreshUnreadCount,
  };
};

// Hook alias for backward compatibility
export const useUnreadCount = useNotificationCount;

// Default export
export default useNotifications;
