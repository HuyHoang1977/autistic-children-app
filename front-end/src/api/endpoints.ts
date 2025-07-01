// src/lib/endpoints.ts - Complete with Enhanced Admin endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    SPECIALIZATIONS: "/auth/specializations",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
    USERS: "/auth/users",
    VERIFY_EMAIL: "/auth/verify-email",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    CHANGE_PASSWORD: "/auth/change-password",
    HEALTH: "/auth/health",
  },

  // Users endpoints
  USERS: {
    PROFILE: "/users/profile",
    UPDATE_PROFILE: "/users/profile",
    UPLOAD_AVATAR: "/users/avatar",
    CHANGE_PASSWORD: "/users/change-password",
    SEARCH: "/users/search",
    LIST: "/users",
    DETAIL: (user_id: number) => `/users/${user_id}`,
    FOLLOW: (user_id: number) => `/users/${user_id}/follow`,
    FOLLOWERS: (user_id: number) => `/users/${user_id}/followers`,
    FOLLOWING: (user_id: number) => `/users/${user_id}/following`,
    BLOCK: (user_id: number) => `/users/${user_id}/block`,
    UNBLOCK: (user_id: number) => `/users/${user_id}/unblock`,
    REPORT: (user_id: number) => `/users/${user_id}/report`,
    HEALTH: "/users/health",
  },

  PROFILE: {
    GET: "/profile",
    UPDATE: "/profile",
    ADD_CHILD: "/profile/child",
    UPDATE_CHILD: (child_id: number) => `/profile/child/${child_id}`,
    DELETE_CHILD: (child_id: number) => `/profile/child/${child_id}`,
    // Avatar endpoints
    AVATAR_UPLOAD: "/profile/avatar",
    AVATAR_UPDATE: "/profile/avatar", 
    AVATAR_DELETE: "/profile/avatar",
  },

  // Article endpoints
  ARTICLES: {
    LIST: "/articles",
    DETAIL: (article_id: number) => `/articles/${article_id}`,
    CREATE: "/articles",
    UPDATE: (article_id: number) => `/articles/${article_id}`,
    DELETE: (article_id: number) => `/articles/${article_id}`,
    TOGGLE_LIKE: (content_id: number) => `/articles/${content_id}/like`,
    SAVE: (article_id: number) => `/articles/${article_id}/save`,
    UNSAVE: (article_id: number) => `/articles/${article_id}/unsave`,
    SHARE: (article_id: number) => `/articles/${article_id}/share`,
    MY_ARTICLES: "/articles/my-articles",
    SAVED_ARTICLES: "/articles/saved",
    FOLLOWED_DOCTORS: "/articles/followed-doctors",
    TRENDING: "/articles/trending",
    FEATURED: "/articles/featured",
    DRAFT: "/articles/draft",
    PUBLISHED: "/articles/published",
    ARCHIVE: (article_id: number) => `/articles/${article_id}/archive`,
    UNARCHIVE: (article_id: number) => `/articles/${article_id}/unarchive`,
    DUPLICATE: (article_id: number) => `/articles/${article_id}/duplicate`,
    PREVIEW: (article_id: number) => `/articles/${article_id}/preview`,
    SEARCH: "/articles/search",
    BY_CATEGORY: (category_id: number) => `/articles/category/${category_id}`,
    BY_TAG: (tag_name: string) => `/articles/tag/${tag_name}`,
    BY_AUTHOR: (author_id: number) => `/articles/author/${author_id}`,
    HEALTH: "/articles/health",
  },

  // Comments endpoints
  COMMENTS: {
    LIST: "/v1/comments",
    CREATE: "/v1/comments",
    UPDATE: (comment_id: number) => `/v1/comments/${comment_id}`,
    DELETE: (comment_id: number) => `/v1/comments/${comment_id}`,
    LIKE: (comment_id: number) => `/v1/comments/${comment_id}/like`,
    UNLIKE: (comment_id: number) => `/v1/comments/${comment_id}/unlike`,
    REPLY: (comment_id: number) => `/v1/comments/${comment_id}/reply`,
    REPLIES: (comment_id: number) => `/v1/comments/${comment_id}/replies`,
    REPORT: (comment_id: number) => `/v1/comments/${comment_id}/report`,
    PIN: (comment_id: number) => `/v1/comments/${comment_id}/pin`,
    UNPIN: (comment_id: number) => `/v1/comments/${comment_id}/unpin`,
    MY_COMMENTS: "/v1/comments/my-comments",
    BY_ARTICLE: (article_id: number) => `/v1/comments/article/${article_id}`,
    BY_USER: (user_id: number) => `/v1/comments/user/${user_id}`,
    HEALTH: "/v1/comments/health",
  },

  // ✅ ENHANCED ADMIN ENDPOINTS - Complete with Hard Delete
  ADMIN: {
    // User Management
    USERS_LIST: "/admin/users",
    USER_DETAIL: (user_id: number) => `/admin/users/${user_id}`,
    UPDATE_USER_STATUS: (user_id: number) => `/admin/users/${user_id}/status`,
    UPDATE_USER_ROLE: (user_id: number) => `/admin/users/${user_id}/role`,
    DELETE_USER: (user_id: number) => `/admin/users/${user_id}`, // Soft delete

    // ✅ NEW: Hard Delete Endpoints
    HARD_DELETE_USER: (user_id: number) => `/admin/users/${user_id}/hard-delete`,
    USER_DELETION_INFO: (user_id: number) => `/admin/users/${user_id}/deletion-info`,
    BATCH_DELETE_USERS: "/admin/users/batch-delete",
    BATCH_HARD_DELETE_USERS: "/admin/users/batch-hard-delete",

    // User Export & Import
    EXPORT_USERS: "/admin/users/export",
    IMPORT_USERS: "/admin/users/import",

    // User Activities & Logs
    USER_ACTIVITIES: (user_id: number) => `/admin/users/${user_id}/activities`,
    USER_LOGIN_HISTORY: (user_id: number) => `/admin/users/${user_id}/login-history`,

    // Content Management
    ARTICLES_LIST: "/admin/articles",
    ARTICLE_DETAIL: (article_id: number) => `/admin/articles/${article_id}`,
    APPROVE_ARTICLE: (article_id: number) => `/admin/articles/${article_id}/approve`,
    REJECT_ARTICLE: (article_id: number) => `/admin/articles/${article_id}/reject`,
    FEATURE_ARTICLE: (article_id: number) => `/admin/articles/${article_id}/feature`,
    UNFEATURE_ARTICLE: (article_id: number) => `/admin/articles/${article_id}/unfeature`,
    DELETE_ARTICLE: (article_id: number) => `/admin/articles/${article_id}`,

    // Comments Management
    COMMENTS_LIST: "/admin/comments",
    COMMENT_DETAIL: (comment_id: number) => `/admin/comments/${comment_id}`,
    APPROVE_COMMENT: (comment_id: number) => `/admin/comments/${comment_id}/approve`,
    REJECT_COMMENT: (comment_id: number) => `/admin/comments/${comment_id}/reject`,
    DELETE_COMMENT: (comment_id: number) => `/admin/comments/${comment_id}`,

    // Reports Management
    REPORTS_LIST: "/admin/reports",
    REPORT_DETAIL: (report_id: number) => `/admin/reports/${report_id}`,
    RESOLVE_REPORT: (report_id: number) => `/admin/reports/${report_id}/resolve`,
    DISMISS_REPORT: (report_id: number) => `/admin/reports/${report_id}/dismiss`,

    // Categories & Tags Management
    CATEGORIES_LIST: "/admin/categories",
    CREATE_CATEGORY: "/admin/categories",
    UPDATE_CATEGORY: (category_id: number) => `/admin/categories/${category_id}`,
    DELETE_CATEGORY: (category_id: number) => `/admin/categories/${category_id}`,

    TAGS_LIST: "/admin/tags",
    CREATE_TAG: "/admin/tags",
    UPDATE_TAG: (tag_id: number) => `/admin/tags/${tag_id}`,
    DELETE_TAG: (tag_id: number) => `/admin/tags/${tag_id}`,
    MERGE_TAGS: "/admin/tags/merge",

    // Statistics & Analytics
    STATS: "/admin/stats",
    DASHBOARD_STATS: "/admin/dashboard/stats",
    USER_STATS: "/admin/stats/users",
    CONTENT_STATS: "/admin/stats/content",
    ACTIVITY_STATS: "/admin/stats/activity",
    REVENUE_STATS: "/admin/stats/revenue",

    // Analytics
    ANALYTICS_OVERVIEW: "/admin/analytics/overview",
    ANALYTICS_USERS: "/admin/analytics/users",
    ANALYTICS_CONTENT: "/admin/analytics/content",
    ANALYTICS_ENGAGEMENT: "/admin/analytics/engagement",

    // System Settings
    SETTINGS: "/admin/settings",
    UPDATE_SETTINGS: "/admin/settings",
    SITE_CONFIG: "/admin/settings/site",
    EMAIL_CONFIG: "/admin/settings/email",
    NOTIFICATION_CONFIG: "/admin/settings/notifications",
    SECURITY_CONFIG: "/admin/settings/security",

    // Backup & Restore
    BACKUP_LIST: "/admin/backups",
    CREATE_BACKUP: "/admin/backups",
    RESTORE_BACKUP: (backup_id: string) => `/admin/backups/${backup_id}/restore`,
    DELETE_BACKUP: (backup_id: string) => `/admin/backups/${backup_id}`,

    // System Logs
    SYSTEM_LOGS: "/admin/logs",
    ERROR_LOGS: "/admin/logs/errors",
    ACCESS_LOGS: "/admin/logs/access",
    AUDIT_LOGS: "/admin/logs/audit",

    // Maintenance
    MAINTENANCE_MODE: "/admin/maintenance",
    CACHE_CLEAR: "/admin/cache/clear",
    SYSTEM_INFO: "/admin/system/info",

    // Health Check
    HEALTH: "/admin/health",
    DETAILED_HEALTH: "/admin/health/detailed",
  },

  // Upload endpoints
  UPLOADS: {
    PRESIGNED_URL: "/v1/uploads/presigned-url",
    CONFIRM: "/v1/uploads/confirm",
    DELETE: (image_id: string) => `/v1/uploads/${image_id}`,
    LIST: "/v1/uploads",
    UPLOAD_PROGRESS: (upload_id: string) => `/v1/uploads/${upload_id}/progress`,
    CANCEL_UPLOAD: (upload_id: string) => `/v1/uploads/${upload_id}/cancel`,
    BATCH_DELETE: "/v1/uploads/batch-delete",
    HEALTH: "/v1/uploads/health",
  },

  // Images endpoints
  IMAGES: {
    UPLOAD: "/images/upload",
    DELETE: "/images/delete",
    LIST: "/images/list",
    HEALTH: "/images/health",
    PROXY: (file_path: string) => `/images/proxy/${file_path}`,
    AVATAR_UPLOAD: (user_id: number) => `/images/avatar/upload/${user_id}`,
    ARTICLE_UPLOAD: (article_id: number) => `/images/article/upload/${article_id}`,
    RESIZE: "/images/resize",
    COMPRESS: "/images/compress",
    OPTIMIZE: "/images/optimize",
    BULK_UPLOAD: "/images/bulk-upload",
    GALLERY: "/images/gallery",
    SEARCH: "/images/search",
  },

  // Categories endpoints
  CATEGORIES: {
    LIST: "/v1/categories",
    DETAIL: (category_id: number) => `/v1/categories/${category_id}`,
    CREATE: "/v1/categories",
    UPDATE: (category_id: number) => `/v1/categories/${category_id}`,
    DELETE: (category_id: number) => `/v1/categories/${category_id}`,
    TREE: "/v1/categories/tree",
    POPULAR: "/v1/categories/popular",
    SEARCH: "/v1/categories/search",
    ARTICLES: (category_id: number) => `/v1/categories/${category_id}/articles`,
    HEALTH: "/v1/categories/health",
  },

  // Tags endpoints
  TAGS: {
    LIST: "/v1/tags",
    DETAIL: (tag_id: number) => `/v1/tags/${tag_id}`,
    CREATE: "/v1/tags",
    UPDATE: (tag_id: number) => `/v1/tags/${tag_id}`,
    DELETE: (tag_id: number) => `/v1/tags/${tag_id}`,
    POPULAR: "/v1/tags/popular",
    TRENDING: "/v1/tags/trending",
    SEARCH: "/v1/tags/search",
    ARTICLES: (tag_id: number) => `/v1/tags/${tag_id}/articles`,
    AUTOCOMPLETE: "/v1/tags/autocomplete",
    HEALTH: "/v1/tags/health",
  },

  // Doctors endpoints
  DOCTORS: {
    LIST: "/v1/doctors",
    DETAIL: (doctor_id: number) => `/v1/doctors/${doctor_id}`,
    CREATE: "/v1/doctors",
    UPDATE: (doctor_id: number) => `/v1/doctors/${doctor_id}`,
    DELETE: (doctor_id: number) => `/v1/doctors/${doctor_id}`,
    FOLLOW: (doctor_id: number) => `/v1/doctors/${doctor_id}/follow`,
    UNFOLLOW: (doctor_id: number) => `/v1/doctors/${doctor_id}/unfollow`,
    FOLLOWERS: (doctor_id: number) => `/v1/doctors/${doctor_id}/followers`,
    FOLLOWING: (doctor_id: number) => `/v1/doctors/${doctor_id}/following`,
    ARTICLES: (doctor_id: number) => `/v1/doctors/${doctor_id}/articles`,
    SCHEDULE: (doctor_id: number) => `/v1/doctors/${doctor_id}/schedule`,
    APPOINTMENTS: (doctor_id: number) => `/v1/doctors/${doctor_id}/appointments`,
    REVIEWS: (doctor_id: number) => `/v1/doctors/${doctor_id}/reviews`,
    VERIFY: (doctor_id: number) => `/v1/doctors/${doctor_id}/verify`,
    SEARCH: "/v1/doctors/search",
    BY_SPECIALTY: (specialty: string) => `/v1/doctors/specialty/${specialty}`,
    FEATURED: "/v1/doctors/featured",
    TOP_RATED: "/v1/doctors/top-rated",
    NEARBY: "/v1/doctors/nearby",
    HEALTH: "/v1/doctors/health",
  },

  // Appointments endpoints
  APPOINTMENTS: {
    LIST: "/v1/appointments",
    DETAIL: (appointment_id: number) => `/v1/appointments/${appointment_id}`,
    CREATE: "/v1/appointments",
    UPDATE: (appointment_id: number) => `/v1/appointments/${appointment_id}`,
    DELETE: (appointment_id: number) => `/v1/appointments/${appointment_id}`,
    CONFIRM: (appointment_id: number) => `/v1/appointments/${appointment_id}/confirm`,
    CANCEL: (appointment_id: number) => `/v1/appointments/${appointment_id}/cancel`,
    RESCHEDULE: (appointment_id: number) => `/v1/appointments/${appointment_id}/reschedule`,
    COMPLETE: (appointment_id: number) => `/v1/appointments/${appointment_id}/complete`,
    REVIEW: (appointment_id: number) => `/v1/appointments/${appointment_id}/review`,
    MY_APPOINTMENTS: "/v1/appointments/my-appointments",
    UPCOMING: "/v1/appointments/upcoming",
    PAST: "/v1/appointments/past",
    AVAILABLE_SLOTS: "/v1/appointments/available-slots",
    HEALTH: "/v1/appointments/health",
  },

  // Notifications endpoints
  NOTIFICATIONS: {
    LIST: "/v1/notifications",
    DETAIL: (notification_id: number) => `/v1/notifications/${notification_id}`,
    MARK_READ: (notification_id: number) => `/v1/notifications/${notification_id}/read`,
    MARK_UNREAD: (notification_id: number) => `/v1/notifications/${notification_id}/unread`,
    MARK_ALL_READ: "/v1/notifications/mark-all-read",
    DELETE: (notification_id: number) => `/v1/notifications/${notification_id}`,
    DELETE_ALL: "/v1/notifications/delete-all",
    UNREAD_COUNT: "/v1/notifications/unread-count",
    PREFERENCES: "/v1/notifications/preferences",
    UPDATE_PREFERENCES: "/v1/notifications/preferences",
    SUBSCRIBE: "/v1/notifications/subscribe",
    UNSUBSCRIBE: "/v1/notifications/unsubscribe",
    TEST: "/v1/notifications/test",
    HEALTH: "/v1/notifications/health",
  },

  // Messages/Chat endpoints
  MESSAGES: {
    CONVERSATIONS: "/v1/messages/conversations",
    CONVERSATION_DETAIL: (conversation_id: number) => `/v1/messages/conversations/${conversation_id}`,
    SEND: "/v1/messages/send",
    MARK_READ: (message_id: number) => `/v1/messages/${message_id}/read`,
    DELETE_MESSAGE: (message_id: number) => `/v1/messages/${message_id}`,
    DELETE_CONVERSATION: (conversation_id: number) => `/v1/messages/conversations/${conversation_id}`,
    SEARCH: "/v1/messages/search",
    UNREAD_COUNT: "/v1/messages/unread-count",
    HEALTH: "/v1/messages/health",
  },

  // Search endpoints
  SEARCH: {
    GLOBAL: "/v1/search",
    ARTICLES: "/v1/search/articles",
    USERS: "/v1/search/users",
    DOCTORS: "/v1/search/doctors",
    CATEGORIES: "/v1/search/categories",
    TAGS: "/v1/search/tags",
    SUGGESTIONS: "/v1/search/suggestions",
    TRENDING: "/v1/search/trending",
    HISTORY: "/v1/search/history",
    CLEAR_HISTORY: "/v1/search/history/clear",
    HEALTH: "/v1/search/health",
  },

  // Analytics endpoints (for users/doctors)
  ANALYTICS: {
    MY_STATS: "/v1/analytics/my-stats",
    ARTICLE_VIEWS: (article_id: number) => `/v1/analytics/articles/${article_id}/views`,
    ARTICLE_ENGAGEMENT: (article_id: number) => `/v1/analytics/articles/${article_id}/engagement`,
    PROFILE_VIEWS: "/v1/analytics/profile-views",
    FOLLOWER_GROWTH: "/v1/analytics/follower-growth",
    ENGAGEMENT_RATE: "/v1/analytics/engagement-rate",
    TOP_CONTENT: "/v1/analytics/top-content",
    AUDIENCE_INSIGHTS: "/v1/analytics/audience-insights",
    HEALTH: "/v1/analytics/health",
  },

  // System endpoints
  SYSTEM: {
    HEALTH: "/health",
    API_HEALTH: "/api/health",
    VERSION: "/version",
    STATUS: "/status",
    PING: "/ping",

    // Debug endpoints (development only)
    DEBUG_ROUTES: "/debug/routes",
    DEBUG_DATABASE: "/debug/database",
    DEBUG_CACHE: "/debug/cache",
    DEBUG_QUEUE: "/debug/queue",

    // Test endpoints (development only)
    TEST_IMAGES: "/test/images",
    TEST_COMMENTS: "/test/comments",
    TEST_ADMIN: "/test/admin",
    TEST_UPLOAD: "/api/test-upload",
    TEST_EMAIL: "/test/email",
    TEST_NOTIFICATIONS: "/test/notifications",

    // Monitoring
    METRICS: "/metrics",
    LOGS: "/logs",

    // Configuration
    CONFIG: "/config",
    FEATURES: "/features",

    // API Documentation
    DOCS: "/docs",
    OPENAPI: "/openapi.json",
    REDOC: "/redoc",
  },

  // WebSocket endpoints
  WEBSOCKET: {
    CONNECT: "/ws",
    NOTIFICATIONS: "/ws/notifications",
    CHAT: "/ws/chat",
    LIVE_UPDATES: "/ws/live-updates",
    ADMIN_UPDATES: "/ws/admin-updates",
  },

  // Third-party integrations
  INTEGRATIONS: {
    GOOGLE_AUTH: "/integrations/google/auth",
    FACEBOOK_AUTH: "/integrations/facebook/auth",
    APPLE_AUTH: "/integrations/apple/auth",

    // Medical APIs
    MEDICAL_DATABASE: "/integrations/medical/database",
    DRUG_INTERACTIONS: "/integrations/medical/drug-interactions",

    // Payment
    STRIPE_WEBHOOK: "/integrations/stripe/webhook",
    PAYPAL_WEBHOOK: "/integrations/paypal/webhook",

    // Communication
    TWILIO_WEBHOOK: "/integrations/twilio/webhook",
    SENDGRID_WEBHOOK: "/integrations/sendgrid/webhook",

    // Analytics
    GOOGLE_ANALYTICS: "/integrations/google-analytics",

    HEALTH: "/integrations/health",
  },
} as const;

// ✅ Export type for better TypeScript support
export type ApiEndpoints = typeof API_ENDPOINTS;

// ✅ Helper function to get endpoint with base URL
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
  return `${baseUrl}${endpoint}`;
};

// ✅ Utility function to build endpoint with parameters
export const buildEndpoint = (
  template: string | ((param: any) => string),
  param?: any
): string => {
  if (typeof template === 'function') {
    return template(param);
  }
  return template;
};

// ✅ Admin-specific endpoint helpers
const ADMIN_ENDPOINTS = {
  // Quick access to commonly used admin endpoints
  getUsersList: () => API_ENDPOINTS.ADMIN.USERS_LIST,
  getUserDetail: (userId: number) => API_ENDPOINTS.ADMIN.USER_DETAIL(userId),
  softDeleteUser: (userId: number) => API_ENDPOINTS.ADMIN.DELETE_USER(userId),
  hardDeleteUser: (userId: number) => API_ENDPOINTS.ADMIN.HARD_DELETE_USER(userId),
  getUserDeletionInfo: (userId: number) => API_ENDPOINTS.ADMIN.USER_DELETION_INFO(userId),
  updateUserStatus: (userId: number) => API_ENDPOINTS.ADMIN.UPDATE_USER_STATUS(userId),
  getStats: () => API_ENDPOINTS.ADMIN.STATS,
  getHealth: () => API_ENDPOINTS.ADMIN.HEALTH,
} as const;

// ✅ Export admin endpoints separately for convenience
export { ADMIN_ENDPOINTS };

// ✅ Development helpers
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// ✅ API versioning support
export const API_VERSION = 'v1';
export const CURRENT_API_BASE = `/api/${API_VERSION}`;

// ✅ Common HTTP status codes for reference
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export default API_ENDPOINTS;