// endpoints.ts - Updated with new endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    SPECIALIZATIONS: "/auth/specializations",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
  },

  USERS: {
    PROFILE: "/users/profile",
    UPDATE_PROFILE: "/users/profile",
    UPLOAD_AVATAR: "/users/avatar",
    CHANGE_PASSWORD: "/users/change-password",
    SEARCH: "/users/search",
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
    SHARE: (article_id: number) => `/articles/${article_id}/share`,
    MY_ARTICLES: "/articles/my-articles",
    SAVED_ARTICLES: "/articles/saved",
    FOLLOWED_DOCTORS: "/articles/followed-doctors",
    TRENDING: "/articles/trending",
    FEATURED: "/articles/featured",
  },

  // Upload endpoints
  UPLOADS: {
    PRESIGNED_URL: "/api/v1/uploads/presigned-url",
    CONFIRM: "/api/v1/uploads/confirm",
    DELETE: (image_id: string) => `/api/v1/uploads/${image_id}`,
    LIST: "/api/v1/uploads",
  },

  // Comments endpoints
  COMMENTS: {
    LIST: "/api/v1/comments",
    CREATE: "/api/v1/comments",
    UPDATE: (comment_id: number) => `/api/v1/comments/${comment_id}`,
    DELETE: (comment_id: number) => `/api/v1/comments/${comment_id}`,
    LIKE: (comment_id: number) => `/api/v1/comments/${comment_id}/like`,
    REPORT: (comment_id: number) => `/api/v1/comments/${comment_id}/report`,
    MY_COMMENTS: "/api/v1/comments/my-comments",
    USER_COMMENTS: "/api/v1/comments/user-comments",
  },

  // Categories endpoints
  CATEGORIES: {
    LIST: "/api/v1/categories",
    DETAIL: (category_id: number) => `/api/v1/categories/${category_id}`,
    CREATE: "/api/v1/categories",
    UPDATE: (category_id: number) => `/api/v1/categories/${category_id}`,
    DELETE: (category_id: number) => `/api/v1/categories/${category_id}`,
  },

  // Tags endpoints
  TAGS: {
    LIST: "/api/v1/tags",
    POPULAR: "/api/v1/tags/popular",
    SEARCH: "/api/v1/tags/search",
  },

  // Doctors endpoints
  DOCTORS: {
    LIST: "/api/v1/doctors",
    DETAIL: (doctor_id: number) => `/api/v1/doctors/${doctor_id}`,
    FOLLOW: (doctor_id: number) => `/api/v1/doctors/${doctor_id}/follow`,
    FOLLOWERS: (doctor_id: number) => `/api/v1/doctors/${doctor_id}/followers`,
    ARTICLES: (doctor_id: number) => `/api/v1/doctors/${doctor_id}/articles`,
  },

  // Notifications endpoints
  NOTIFICATIONS: {
    LIST: "/api/v1/notifications",
    MARK_READ: (notification_id: number) => `/api/v1/notifications/${notification_id}/read`,
    MARK_ALL_READ: "/api/v1/notifications/mark-all-read",
    DELETE: (notification_id: number) => `/api/v1/notifications/${notification_id}`,
  },
} as const;