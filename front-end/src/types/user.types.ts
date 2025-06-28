// Role ID constants
export const ROLE_ADMIN = 1;
export const ROLE_DOCTOR = 2;
export const ROLE_PARENT = 3;
export const ROLE_GUEST = 0;

// Role model
export interface RoleInfo {
  role_id: number;
  role_name: string;
  description?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Base User từ bảng USERS
export interface BaseUser {
  user_id: number;
  username: string;
  email: string; // ✅ Đảm bảo email luôn có
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_active: boolean;
  user_type?: number | null;
  role_id: number; // ✅ Required
}

// Parent User từ bảng PARENTS
export interface ParentInfo {
  parent_id: number;
  user_id: number;
  number_of_children?: number | null;
  children_info?: string | null;
  parenting_concerns?: string | null;
  last_activity?: string | null;
  role_id?: number | null;
}

export interface ParentUser extends BaseUser {
  children: boolean;
  role_id: typeof ROLE_PARENT;
  parent_info: ParentInfo | null;
}

// Doctor User từ bảng DOCTORS
export interface DoctorInfo {
  doctor_id: number;
  user_id: number;
  license_number?: string | null;
  specialty?: string | null;
  years_experience?: number | null;
  bio?: string | null;
  clinic_name?: string | null;
  clinic_address?: string | null;
  verified?: boolean | null;
  verification_date?: string | null;
  rating?: number | null;
  total_reviews?: number | null;
  role_id?: number | null;
}

export interface DoctorUser extends BaseUser {
  role_id: typeof ROLE_DOCTOR;
  doctor_info: DoctorInfo | null;
}

// Admin User từ bảng ADMINS
export interface AdminInfo {
  admin_id: number;
  user_id: number;
  admin_role?: string | null;
  permissions?: string | null;
  last_login?: string | null;
  role_id?: number | null;
}

export interface AdminUser extends BaseUser {
  role_id: typeof ROLE_ADMIN;
  admin_info: AdminInfo | null;
}

// Child Info từ bảng CHILDS
export interface ChildInfo {
  child_id: number;
  parent_id: number;
  name: string;
  birth_date: string;
  gender: string;
  weight?: number | null;
  height?: number | null;
  medical_history?: string | null;
  allergies?: string | null;
  vaccination_record?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Doctor Specialization
export interface DoctorSpecialization {
  doctor_id: number;
  specialization: string;
  is_primary: boolean;
}

// Doctor Follow
export interface DoctorFollow {
  follow_id: number;
  parent_id: number;
  doctor_id: number;
  followed_at: string;
  is_active: boolean;
}

// ✅ Fixed Guest user - thêm email để tương thích
export interface GuestUser {
  user_id: 0; // ✅ Thêm user_id
  role_id: typeof ROLE_GUEST;
  sessionId: string;
  username: string;
  email: string; // ✅ Thêm email để tương thích
  full_name: string;
  is_active: false;
  phone?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_type?: number | null;
}

// ✅ Authenticated Users only (không bao gồm Guest)
export type AuthenticatedUser = ParentUser | DoctorUser | AdminUser;

// ✅ All Users including Guest
export type User = AuthenticatedUser | GuestUser;

// Type guards
export function isParentUser(user: User): user is ParentUser {
  return user.role_id === ROLE_PARENT && !!(user as ParentUser).parent_info;
}

export function isDoctorUser(user: User): user is DoctorUser {
  return user.role_id === ROLE_DOCTOR && !!(user as DoctorUser).doctor_info;
}

export function isAdminUser(user: User): user is AdminUser {
  return user.role_id === ROLE_ADMIN && !!(user as AdminUser).admin_info;
}

export function isGuestUser(user: User): user is GuestUser {
  return user.role_id === ROLE_GUEST && !!(user as GuestUser).sessionId;
}

export function isAuthenticatedUser(user: User): user is AuthenticatedUser {
  return user.role_id !== ROLE_GUEST && user.user_id > 0;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

// ✅ Fixed - remove duplicate RegisterRequest
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role_id: number;
  is_active?: boolean;

  // Parent specific fields
  number_of_children?: number;
  children_info?: string;
  parenting_concerns?: string;

  // Doctor specific fields
  specialty?: string;
  license_number?: string;
  clinic_name?: string;
  clinic_address?: string;
  years_experience?: number;
  bio?: string;
}

// Auth Response
export interface AuthResponse {
  success: boolean;
  data?: {
    user: AuthenticatedUser; // ✅ Only authenticated users can login
    token: string;
    refresh_token?: string;
  };
  errors?: Array<string | { field: string; message: string }>;
  error?: string;
}

// User Context types for React
export interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<BaseUser>) => Promise<void>;
}