// Export all types from individual modules
// Note: Order matters to avoid conflicts

// Export API types first (base types)
export * from "./api.types";

// Export system types
export * from "./system.types";

// Export user types
export * from "./user.types";

// Export content types last (depends on api.types)
export * from "./content.types";

// Constants
export {
  ROLE_ADMIN,
  ROLE_DOCTOR,
  ROLE_PARENT,
  ROLE_GUEST
} from './user.types';

// Type utility helpers
export {
  isParentUser,
  isDoctorUser,
  isAdminUser,
  isGuestUser,
  isAuthenticatedUser
} from './user.types';