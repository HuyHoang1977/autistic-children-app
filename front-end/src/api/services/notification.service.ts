import { API_ENDPOINTS } from '../endpoints';
import apiClient from '../client';
import type {
  Notification,
  NotificationResponse,
  NotificationCountResponse,
  NotificationMarkReadResponse,
  NotificationDeleteResponse,
  NotificationPreferences,
  NotificationPreferencesResponse,
  GetNotificationsRequest,
  UpdateNotificationPreferencesRequest,
} from '../../types/notification';

class NotificationService {
  /**
   * Get user notifications
   */
  async getNotifications(params: GetNotificationsRequest = {}): Promise<NotificationResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.offset) {
      queryParams.append('offset', params.offset.toString());
    }
    if (params.unread_only) {
      queryParams.append('unread_only', params.unread_only.toString());
    }

    const url = `${API_ENDPOINTS.NOTIFICATIONS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await apiClient.get<NotificationResponse>(url);
    return response.data;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<NotificationCountResponse> {
    const response = await apiClient.get<NotificationCountResponse>(
      API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT
    );
    return response.data;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<NotificationMarkReadResponse> {
    const response = await apiClient.put<NotificationMarkReadResponse>(
      API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId)
    );
    return response.data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<NotificationMarkReadResponse> {
    const response = await apiClient.put<NotificationMarkReadResponse>(
      API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ
    );
    return response.data;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: number): Promise<NotificationDeleteResponse> {
    const response = await apiClient.delete<NotificationDeleteResponse>(
      API_ENDPOINTS.NOTIFICATIONS.DELETE(notificationId)
    );
    return response.data;
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferencesResponse> {
    const response = await apiClient.get<NotificationPreferencesResponse>(
      API_ENDPOINTS.NOTIFICATIONS.PREFERENCES
    );
    return response.data;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    request: UpdateNotificationPreferencesRequest
  ): Promise<NotificationPreferencesResponse> {
    const response = await apiClient.put<NotificationPreferencesResponse>(
      API_ENDPOINTS.NOTIFICATIONS.UPDATE_PREFERENCES,
      request
    );
    return response.data;
  }

  /**
   * Subscribe to notifications (for web push)
   */
  async subscribe(subscriptionData: any): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string }>(
      API_ENDPOINTS.NOTIFICATIONS.SUBSCRIBE,
      subscriptionData
    );
    return response.data;
  }

  /**
   * Unsubscribe from notifications
   */
  async unsubscribe(): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete<{ success: boolean; message?: string }>(
      API_ENDPOINTS.NOTIFICATIONS.UNSUBSCRIBE
    );
    return response.data;
  }

  /**
   * Test notification (for development)
   */
  async testNotification(): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string }>(
      API_ENDPOINTS.NOTIFICATIONS.TEST
    );
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.get<{ success: boolean; message?: string }>(
      API_ENDPOINTS.NOTIFICATIONS.HEALTH
    );
    return response.data;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
