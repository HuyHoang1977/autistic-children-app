export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    SPECIALIZATIONS: "/auth/specializations",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    // FORGOT_PASSWORD: "/auth/forgot-password",
    // RESET_PASSWORD: "/auth/reset-password",
    // VERIFY_EMAIL: "/auth/verify-email",
  },

  USERS: {
    PROFILE: "/users/profile",
    UPDATE_PROFILE: "/users/profile",
    UPLOAD_AVATAR: "/users/avatar",
    CHANGE_PASSWORD: "/users/change-password",
    SEARCH: "/users/search",
  },

  // Article endpoints - Fixed URL paths
  ARTICLES: {
    LIST: "/auth/articles",                                           // ✅ Đã sửa
    DETAIL: (article_id: number) => `/auth/articles/${article_id}`,
    CREATE: "/auth/articles",
    UPDATE: (article_id: number) => `/auth/articles/${article_id}`,
    DELETE: (article_id: number) => `/auth/articles/${article_id}`,
    TOGGLE_LIKE: (content_id: number) => `/auth/articles/${content_id}/like`,
    SAVE: (article_id: number) => `/auth/articles/${article_id}/save`,
    SHARE: (article_id: number) => `/auth/articles/${article_id}/share`,
    MY_ARTICLES: "/auth/articles/my-articles",
    SAVED_ARTICLES: "/auth/articles/saved",
    FOLLOWED_DOCTORS: "/auth/articles/followed-doctors",
    TRENDING: "/auth/articles/trending",
    FEATURED: "/auth/articles/featured",
  },
} as const;