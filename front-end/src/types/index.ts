// Export all types from individual modules
// FIXED: Chỉ sử dụng export * để tránh xung đột hoàn toàn

// Export API types first (base types)
export * from "./api.types";

// Export system types
export * from "./system.types";

// Export user types
export * from "./user.types";

// Export content types last (depends on api.types)
export * from "./content.types";

// FIXED: Chỉ export các constants và functions từ user.types
// KHÔNG export lại toSafeArticle vì đã được export từ content.types
export {
  ROLE_ADMIN,
  ROLE_DOCTOR,
  ROLE_PARENT,
  ROLE_GUEST,
  isParentUser,
  isDoctorUser,
  isAdminUser,
  isGuestUser,
  isAuthenticatedUser
} from './user.types';

// toSafeArticle đã được export từ content.types thông qua export * ở trên
// Không cần export lại