// System and utility types

// Pagination
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  has_more_pages: boolean;
  from?: number;
  to?: number;
}

// Sort options
export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  label: string;
}

// Filter options
export interface FilterOption {
  key: string;
  value: any;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'boolean';
}

// Search options
export interface SearchOptions {
  query?: string;
  filters?: Record<string, any>;
  sort?: SortOption;
  pagination?: {
    page: number;
    limit: number;
  };
}

// Upload file types
export interface UploadedFile {
  file_id: string;
  original_name: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  uploaded_by: number;
}

// Notification từ bảng NOTIFICATIONS
export interface Notification {
  notification_id: number;
  user_id: number;
  type: "new_article" | "new_comment" | "new_follower" | "article_liked" | "system";
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
  action_url?: string;
  data?: Record<string, any>;
}

// Message từ bảng MESSAGES
export interface Message {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;

  sender: {
    user_id: number;
    username: string;
    full_name: string;
    avatar_url?: string;
    role_id?: number;
  };
}

// Appointment từ bảng APPOINTMENTS
export interface Appointment {
  appointment_id: number;
  doctor_id: number;
  parent_id: number;
  child_id?: number;
  appointment_date: Date;
  appointment_type: string;
  symptoms?: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  created_at: Date;
  updated_at: Date;

  doctor: {
    user_id: number;
    full_name: string;
    specialty: string;
    clinic_name?: string;
    avatar_url?: string;
    role_id?: number;
  };

  child?: {
    child_id: number;
    birth_date: Date;
    gender: string;
  };
}

// Medical Record từ bảng MEDICAL_RECORDS
export interface MedicalRecord {
  record_id: number;
  appointment_id: number;
  doctor_id: number;
  child_id: number;
  diagnosis: string;
  treatment: string;
  prescription?: string;
  notes?: string;
  height?: number;
  weight?: number;
  vaccination_record?: string;
  created_at: Date;
  updated_at: Date;
}

// Conversation (grouped messages)
export interface Conversation {
  participant: {
    user_id: number;
    username: string;
    full_name: string;
    avatar_url?: string;
    role_id?: number;
  };
  last_message: Message;
  unread_count: number;
}

// Settings
export interface UserSettings {
  user_id: number;
  email_notifications: boolean;
  push_notifications: boolean;
  privacy_level: 'public' | 'friends' | 'private';
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
}

// Activity log
export interface ActivityLog {
  activity_id: number;
  user_id: number;
  action: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// System stats
export interface SystemStats {
  total_users: number;
  total_articles: number;
  total_comments: number;
  active_users_today: number;
  new_registrations_today: number;
  last_updated: string;
}