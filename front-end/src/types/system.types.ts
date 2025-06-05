import type { UserRole } from "./user.types"

// Notification từ bảng NOTIFICATIONS
export interface Notification {
  notification_id: number
  user_id: number
  type: "new_article" | "new_comment" | "new_follower" | "article_liked" | "system"
  title: string
  message: string
  is_read: boolean
  created_at: Date
  updated_at: Date
  action_url?: string
  data?: Record<string, any>
}

// Message từ bảng MESSAGES
export interface Message {
  message_id: number
  sender_id: number
  receiver_id: number
  subject: string
  content: string
  is_read: boolean
  created_at: Date
  updated_at: Date

  sender: {
    user_id: number
    username: string
    first_name: string
    last_name: string
    avatar_url?: string
    role: UserRole
  }
}

// Appointment từ bảng APPOINTMENTS
export interface Appointment {
  appointment_id: number
  doctor_id: number
  parent_id: number
  child_id?: number
  appointment_date: Date
  appointment_type: string
  symptoms?: string
  status: "scheduled" | "completed" | "cancelled" | "no_show"
  created_at: Date
  updated_at: Date

  doctor: {
    user_id: number
    first_name: string
    last_name: string
    specialty: string
    clinic_name?: string
    avatar_url?: string
  }

  child?: {
    child_id: number
    birth_date: Date
    gender: string
  }
}

// Medical Record từ bảng MEDICAL_RECORDS
export interface MedicalRecord {
  record_id: number
  appointment_id: number
  doctor_id: number
  child_id: number
  diagnosis: string
  treatment: string
  prescription?: string
  notes?: string
  height?: number
  weight?: number
  vaccination_record?: string
  created_at: Date
  updated_at: Date
}

// Conversation (grouped messages)
export interface Conversation {
  participant: {
    user_id: number
    username: string
    first_name: string
    last_name: string
    avatar_url?: string
    role: UserRole
  }
  last_message: Message
  unread_count: number
}
