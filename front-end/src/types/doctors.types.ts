// Doctor related types for frontend

export interface DoctorSpecialization {
  specialization: string;
  is_primary: boolean;
}

export interface Doctor {
  doctor_id: number;
  user_id: number;
  license_number?: string;
  specialty?: string;
  years_experience?: number;
  bio?: string;
  clinic_name?: string;
  clinic_address?: string;
  verified: boolean;
  verification_date?: string;
  rating?: number;
  total_reviews?: number;
  role_id?: number;
  
  // User information from join
  full_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  
  // Followers count
  followers_count: number;
  
  // Specializations list
  specializations: DoctorSpecialization[];
  
  // Primary specialty (computed from specializations)
  primary_specialty?: string;
}

export interface DoctorFilters {
  search_term?: string;
  clinic_name?: string;
  clinic_address?: string;
  specialty?: string;
  sort_by?: 'rating' | 'followers' | 'experience';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface DoctorPagination {
  page: number;
  pages: number;
  per_page: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface DoctorsResponse {
  success: boolean;
  message: string;
  data: {
    doctors: Doctor[];
    pagination: DoctorPagination;
  };
  error?: string;
}

export interface DoctorResponse {
  success: boolean;
  message: string;
  data: Doctor;
  error?: string;
}

export interface DoctorSearchResponse {
  success: boolean;
  message: string;
  data: Doctor[];
  error?: string;
}

export interface SpecializationsResponse {
  success: boolean;
  message: string;
  data: string[];
  error?: string;
}

export interface DoctorStatistics {
  total_verified_doctors: number;
  total_specializations: number;
  top_rated_doctors: Doctor[];
  most_followed_doctors: Doctor[];
  available_specializations: string[];
}

export interface DoctorStatisticsResponse {
  success: boolean;
  message: string;
  data: DoctorStatistics;
  error?: string;
}

// Doctor card component props
export interface DoctorCardProps {
  doctor: Doctor;
  onViewDetails?: (doctorId: number) => void;
  onFollow?: (doctorId: number) => void;
  showFollowButton?: boolean;
  compact?: boolean;
}

// Doctor search/filter component props
export interface DoctorSearchProps {
  filters: DoctorFilters;
  onFiltersChange: (filters: DoctorFilters) => void;
  specializations: string[];
  isLoading?: boolean;
}
