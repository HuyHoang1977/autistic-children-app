// Role ID constants
export const ROLE_ADMIN = 1
export const ROLE_DOCTOR = 2
export const ROLE_PARENT = 3


// Role model
export interface RoleInfo {
  role_id: number
  role_name: string
  description?: string | null
  is_active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

// Base User từ bảng USERS
export interface BaseUser {
  user_id: number
  username: string
  email: string
  full_name: string
  phone?: string | null
  avatar_url?: string | null
  created_at?: string | null
  updated_at?: string | null
  is_active: boolean
  user_type?: number | null
  role_id?: number 
}

// Parent User từ bảng PARENTS
export interface ParentInfo {
  parent_id: number
  user_id: number
  number_of_children?: number | null
  children_info?: string | null
  parenting_concerns?: string | null
  last_activity?: string | null
  role_id?: number | null
}

export interface ParentUser extends BaseUser {
  role_id: typeof ROLE_PARENT
  parent_info: ParentInfo | null
}

// Doctor User từ bảng DOCTORS
export interface DoctorInfo {
  doctor_id: number
  user_id: number
  license_number?: string | null
  specialty?: string | null
  years_experience?: number | null
  bio?: string | null
  clinic_name?: string | null
  clinic_address?: string | null
  verified?: boolean | null
  verification_date?: string | null
  rating?: number | null
  total_reviews?: number | null
  role_id?: number | null
}

export interface DoctorUser extends BaseUser {
  role_id: typeof ROLE_DOCTOR
  doctor_info: DoctorInfo | null
}

// Admin User từ bảng ADMINS
export interface AdminInfo {
  admin_id: number
  user_id: number
  admin_role?: string | null
  permissions?: string | null
  last_login?: string | null
  role_id?: number | null
}

export interface AdminUser extends BaseUser {
  role_id: typeof ROLE_ADMIN
  admin_info: AdminInfo | null
}

// Child Info từ bảng CHILDS
export interface ChildInfo {
  child_id: number
  parent_id: number
  name: string
  birth_date: string
  gender: string
  weight?: number | null
  height?: number | null
  medical_history?: string | null
  allergies?: string | null
  vaccination_record?: string | null
  created_at?: string | null
  updated_at?: string | null
}

// Doctor Specialization
export interface DoctorSpecialization {
  doctor_id: number
  specialization: string
  is_primary: boolean
}

// Doctor Follow
export interface DoctorFollow {
  follow_id: number
  parent_id: number
  doctor_id: number
  followed_at: string
  is_active: boolean
}

// Guest user (không đăng nhập)
export interface GuestUser {
  role_id: 0
  sessionId: string
}

// Union type
export type User = ParentUser | DoctorUser | AdminUser | GuestUser

// Type guards
export function isParentUser(user: User): user is ParentUser {
  return user.role_id === ROLE_PARENT && !!(user as ParentUser).parent_info
}

export function isDoctorUser(user: User): user is DoctorUser {
  return user.role_id === ROLE_DOCTOR && !!(user as DoctorUser).doctor_info
}

export function isAdminUser(user: User): user is AdminUser {
  return user.role_id === ROLE_ADMIN && !!(user as AdminUser).admin_info
}

export function isGuestUser(user: User): user is GuestUser {
  return user.role_id === 0 && (user as GuestUser).sessionId !== undefined
}


// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  full_name: string
  phone?: string
  role_id: number
  is_active?: boolean
  // Parent specific
  // address?: string
  // emergency_contact?: string
  // Doctor specific
  specialty?: string
  license_number?: string
  clinic_name?: string
  clinic_address?: string
}