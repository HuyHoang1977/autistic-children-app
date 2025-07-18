// Notification types
export interface Notification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: number; // 1: info, 2: warning, 3: success, 4: error
  is_read: boolean;
  created_at: string;
  notification_metadata?: string; // JSON string
}

export interface NotificationMetadata {
  type: 'follow' | 'new_article' | 'comment' | 'like' | 'system';
  // For follow notifications
  follower_id?: number;
  follower_name?: string;
  // For article notifications
  article_id?: number;
  article_title?: string;
  doctor_name?: string;
  // For comment notifications
  comment_id?: number;
  comment_content?: string;
  // For like notifications
  content_type?: 'article' | 'comment';
  content_id?: number;
  // Additional data
  [key: string]: any;
}

export interface NotificationResponse {
  success: boolean;
  data?: Notification[];
  unread_count?: number;
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
  message?: string;
}

export interface NotificationCountResponse {
  success: boolean;
  unread_count: number;
  message?: string;
}

export interface NotificationMarkReadResponse {
  success: boolean;
  notification?: Notification;
  message?: string;
}

export interface NotificationDeleteResponse {
  success: boolean;
  message: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  follow_notifications: boolean;
  article_notifications: boolean;
  comment_notifications: boolean;
  like_notifications: boolean;
  system_notifications: boolean;
}

export interface NotificationPreferencesResponse {
  success: boolean;
  preferences?: NotificationPreferences;
  message?: string;
}

// Request types
export interface GetNotificationsRequest {
  limit?: number;
  offset?: number;
  unread_only?: boolean;
}

export interface UpdateNotificationPreferencesRequest {
  preferences: Partial<NotificationPreferences>;
}

// Helper types
export type NotificationType = 'info' | 'warning' | 'success' | 'error';
export type NotificationCategory = 'follow' | 'new_article' | 'comment' | 'like' | 'system';

// Notification type constants
export const NOTIFICATION_TYPES = {
  INFO: 1,
  WARNING: 2,
  SUCCESS: 3,
  ERROR: 4,
} as const;

export const NOTIFICATION_CATEGORIES = {
  FOLLOW: 'follow',
  NEW_ARTICLE: 'new_article',
  COMMENT: 'comment',
  LIKE: 'like',
  SYSTEM: 'system',
} as const;

// Utility functions
export const getNotificationTypeLabel = (type: number): NotificationType => {
  switch (type) {
    case NOTIFICATION_TYPES.INFO:
      return 'info';
    case NOTIFICATION_TYPES.WARNING:
      return 'warning';
    case NOTIFICATION_TYPES.SUCCESS:
      return 'success';
    case NOTIFICATION_TYPES.ERROR:
      return 'error';
    default:
      return 'info';
  }
};

export const getNotificationTypeColor = (type: number): string => {
  switch (type) {
    case NOTIFICATION_TYPES.INFO:
      return 'text-blue-600';
    case NOTIFICATION_TYPES.WARNING:
      return 'text-yellow-600';
    case NOTIFICATION_TYPES.SUCCESS:
      return 'text-green-600';
    case NOTIFICATION_TYPES.ERROR:
      return 'text-red-600';
    default:
      return 'text-blue-600';
  }
};

export const parseNotificationMetadata = (metadata?: string): NotificationMetadata | null => {
  if (!metadata) return null;
  try {
    return JSON.parse(metadata);
  } catch (error) {
    console.error('Failed to parse notification metadata:', error);
    return null;
  }
};

export const formatNotificationTime = (createdAt: string): string => {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Vừa xong';
  } else if (diffMins < 60) {
    return `${diffMins} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else {
    return date.toLocaleDateString('vi-VN');
  }
};
