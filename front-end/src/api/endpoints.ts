export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    SPECIALIZATIONS: "/auth/specializations",
    LOGOUT: "/auth/logout",
    // REFRESH: "/auth/refresh",
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
} as const;