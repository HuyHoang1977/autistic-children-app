// Base User từ bảng USERS
export interface BaseUser {
  user_id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  avatar_url?: string
  bio?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export enum UserRole {
  GUEST = "guest",
  PARENT = "parent",
  DOCTOR = "doctor",
  ADMIN = "admin",
}

// Parent User từ bảng PARENTS
export interface ParentUser extends BaseUser {
  role: UserRole.PARENT
  parent_id: number
  number_of_children: number
  address?: string
  emergency_contact?: string
  last_activity: Date
  children?: ChildInfo[]
  followedDoctors?: DoctorFollow[]
}

// Doctor User từ bảng DOCTORS
export interface DoctorUser extends BaseUser {
  role: UserRole.DOCTOR
  doctor_id: number
  specialty: string
  qualifications: string
  license_number: string
  clinic_name?: string
  clinic_address?: string
  verified: boolean
  verification_date?: Date
  total_reviews: number
  total_rating: number
  specializations?: DoctorSpecialization[]
  followers?: DoctorFollow[]
}

// Admin User từ bảng ADMINS
export interface AdminUser extends BaseUser {
  role: UserRole.ADMIN
  admin_id: number
  admin_role: string
  permissions: string
  last_login: Date
}

// Child Info từ bảng CHILD
export interface ChildInfo {
  child_id: number
  parent_id: number
  birth_date: Date
  gender: string
  height?: number
  weight?: number
  medical_history?: string
  vaccination_record?: string
  created_at: Date
  updated_at: Date
}

// Doctor Specialization
export interface DoctorSpecialization {
  doctor_id: number
  specialty: string
  is_primary: boolean
}

// Doctor Follow
export interface DoctorFollow {
  follow_id: number
  parent_id: number
  doctor_id: number
  followed_at: Date
}

// Guest user (không đăng nhập)
export interface GuestUser {
  role: UserRole.GUEST
  sessionId: string
}

// Union type
export type User = ParentUser | DoctorUser | AdminUser | GuestUser

// Type guards
export const isParentUser = (user: User): user is ParentUser => {
  return user.role === UserRole.PARENT
}

export const isDoctorUser = (user: User): user is DoctorUser => {
  return user.role === UserRole.DOCTOR
}

export const isAdminUser = (user: User): user is AdminUser => {
  return user.role === UserRole.ADMIN
}

export const isGuestUser = (user: User): user is GuestUser => {
  return user.role === UserRole.GUEST
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
  first_name: string
  last_name: string
  phone?: string
  role: UserRole.PARENT
  // Parent specific
  address?: string
  emergency_contact?: string
}
