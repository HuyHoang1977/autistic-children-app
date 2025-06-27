// endpoints.ts - Updated with FIXED comment endpoints
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
    HEALTH: "/articles/health",
  },

  // ✅ FIXED: Comments endpoints - URL đúng cho backend
  COMMENTS: {
    LIST: "/v1/comments",
    CREATE: "/v1/comments",
    UPDATE: (comment_id: number) => `/v1/comments/${comment_id}`,
    DELETE: (comment_id: number) => `/v1/comments/${comment_id}`,
    LIKE: (comment_id: number) => `/v1/comments/${comment_id}/like`,
    REPORT: (comment_id: number) => `/v1/comments/${comment_id}/report`,
    MY_COMMENTS: "/v1/comments/my-comments",
    HEALTH: "/v1/comments/health",
  },

  // Upload endpoints
  UPLOADS: {
    PRESIGNED_URL: "/v1/uploads/presigned-url",
    CONFIRM: "/v1/uploads/confirm",
    DELETE: (image_id: string) => `/v1/uploads/${image_id}`,
    LIST: "/v1/uploads",
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
  },

  // Categories endpoints
  CATEGORIES: {
    LIST: "/v1/categories",
    DETAIL: (category_id: number) => `/v1/categories/${category_id}`,
    CREATE: "/v1/categories",
    UPDATE: (category_id: number) => `/v1/categories/${category_id}`,
    DELETE: (category_id: number) => `/v1/categories/${category_id}`,
  },

  // Tags endpoints
  TAGS: {
    LIST: "/v1/tags",
    POPULAR: "/v1/tags/popular",
    SEARCH: "/v1/tags/search",
  },

  // Doctors endpoints
  DOCTORS: {
    LIST: "/v1/doctors",
    DETAIL: (doctor_id: number) => `/v1/doctors/${doctor_id}`,
    FOLLOW: (doctor_id: number) => `/v1/doctors/${doctor_id}/follow`,
    FOLLOWERS: (doctor_id: number) => `/v1/doctors/${doctor_id}/followers`,
    ARTICLES: (doctor_id: number) => `/v1/doctors/${doctor_id}/articles`,
  },

  // Notifications endpoints
  NOTIFICATIONS: {
    LIST: "/v1/notifications",
    MARK_READ: (notification_id: number) => `/v1/notifications/${notification_id}/read`,
    MARK_ALL_READ: "/v1/notifications/mark-all-read",
    DELETE: (notification_id: number) => `/v1/notifications/${notification_id}`,
  },

  // System endpoints
  SYSTEM: {
    HEALTH: "/health",
    API_HEALTH: "/api/health",
    DEBUG_ROUTES: "/debug/routes",
    TEST_IMAGES: "/test/images",
    TEST_COMMENTS: "/test/comments",
    TEST_UPLOAD: "/api/test-upload",
  },
} as const;