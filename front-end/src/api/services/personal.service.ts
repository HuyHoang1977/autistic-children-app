import { API_ENDPOINTS } from '../endpoints';
import apiClient from '../client';

// ✅ Types for Personal API
export interface PersonalProfile {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  user_type: 'parent' | 'doctor';
  role_id: number;
  
  // Doctor specific info
  doctor_info?: {
    doctor_id: number;
    license_number?: string;
    specialty?: string;
    years_experience?: number;
    bio?: string;
    clinic_name?: string;
    clinic_address?: string;
    verified: boolean;
    rating?: number;
    total_reviews?: number;
  };
  
  // Parent specific info
  parent_info?: {
    parent_id: number;
    number_of_children?: number;
    children_info?: string;
    parenting_concerns?: string;
    last_activity?: string;
  };
  
  // Children info (for parents)
  children?: Child[];
  children_count?: number;
  
  role?: {
    role_id: number;
    role_name: string;
    description?: string;
  };
}

export interface Child {
  child_id: number;
  parent_id: number;
  name: string;
  birth_date: string;
  gender: 'male' | 'female';
  age?: number;
  weight?: number;
  height?: number;
  medical_history?: string;
  allergies?: string;
  vaccination_record?: string;
  created_at: string;
  updated_at: string;
}

export interface Article {
  article_id: number;
  title: string;
  content?: string;
  excerpt?: string;
  featured_image?: string;
  author_id: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  category?: string;
  tags?: string;
  like_count: number;
  comment_count: number;
  views: number;
  reading_time?: number;
}

export interface ArticleStats {
  total_articles: number;
  published_articles: number;
  draft_articles: number;
}

export interface DoctorInfo {
  doctor_id: number;
  user_info: {
    user_id: number;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  license_number?: string;
  specialty?: string;
  years_experience?: number;
  bio?: string;
  clinic_name?: string;
  clinic_address?: string;
  verified: boolean;
  rating?: number;
  total_reviews?: number;
  followed_at: string;
}

export interface ParentInfo {
  parent_id: number;
  user_info: {
    user_id: number;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  number_of_children?: number;
  children_info?: string;
  parenting_concerns?: string;
  children: Child[];
  children_count: number;
  followed_at: string;
}

export interface FollowStats {
  user_type: 'parent' | 'doctor';
  total_following?: number;
  total_followers?: number;
}

export interface DashboardData {
  user_info: PersonalProfile;
  article_stats: ArticleStats;
  follow_stats: FollowStats;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  pages: number;
  current_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

// ✅ Personal Service Class
export class PersonalService {
  
  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: number): Promise<ApiResponse<PersonalProfile>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PERSONAL.PROFILE(userId));
      return response.data as ApiResponse<PersonalProfile>;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Get current user's profile
   */
  static async getMyProfile(): Promise<ApiResponse<PersonalProfile>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PERSONAL.MY_PROFILE);
      return response.data as ApiResponse<PersonalProfile>;
    } catch (error) {
      console.error('Error fetching my profile:', error);
      throw error;
    }
  }

  /**
   * Get user's articles
   */
  static async getUserArticles(
    userId: number,
    page: number = 1,
    perPage: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Article>>> {
    try {
      console.log('PersonalService.getUserArticles called with:', { userId, page, perPage });
      const response = await apiClient.get(API_ENDPOINTS.PERSONAL.ARTICLES(userId), {
        params: { page, per_page: perPage }
      });
      console.log('PersonalService.getUserArticles response:', response.data);
      return response.data as ApiResponse<PaginatedResponse<Article>>;
    } catch (error) {
      console.error('Error fetching user articles:', error);
      throw error;
    }
  }

  /**
   * Get current user's articles
   */
  static async getMyArticles(
    page: number = 1,
    perPage: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Article>>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PERSONAL.MY_ARTICLES, {
        params: { page, per_page: perPage }
      });
      return response.data as ApiResponse<PaginatedResponse<Article>>;
    } catch (error) {
      console.error('Error fetching my articles:', error);
      throw error;
    }
  }

  /**
   * Get user's article statistics
   */
  static async getArticleStats(userId: number): Promise<ApiResponse<ArticleStats>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PERSONAL.ARTICLE_STATS(userId));
      return response.data as ApiResponse<ArticleStats>;
    } catch (error) {
      console.error('Error fetching article stats:', error);
      throw error;
    }
  }

  /**
   * Get doctors that parent is following
   */
  static async getFollowingDoctors(
    userId: number,
    page: number = 1,
    perPage: number = 10
  ): Promise<ApiResponse<PaginatedResponse<DoctorInfo>>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PERSONAL.FOLLOWING(userId), {
        params: { page, per_page: perPage }
      });
      return response.data as ApiResponse<PaginatedResponse<DoctorInfo>>;
    } catch (error) {
      console.error('Error fetching following doctors:', error);
      throw error;
    }
  }

  /**
   * Get doctors that current user is following
   */
  static async getMyFollowing(
    page: number = 1,
    perPage: number = 10
  ): Promise<ApiResponse<PaginatedResponse<DoctorInfo>>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PERSONAL.MY_FOLLOWING, {
        params: { page, per_page: perPage }
      });
      return response.data as ApiResponse<PaginatedResponse<DoctorInfo>>;
    } catch (error) {
      console.error('Error fetching my following:', error);
      throw error;
    }
  }

  /**
   * Get parents following a doctor
   */
  static async getDoctorFollowers(
    userId: number,
    page: number = 1,
    perPage: number = 10
  ): Promise<ApiResponse<PaginatedResponse<ParentInfo>>> {
    try {
      console.log('PersonalService.getDoctorFollowers called with:', { userId, page, perPage });
      const response = await apiClient.get(API_ENDPOINTS.PERSONAL.FOLLOWERS(userId), {
        params: { page, per_page: perPage }
      });
      console.log('PersonalService.getDoctorFollowers response:', response.data);
      return response.data as ApiResponse<PaginatedResponse<ParentInfo>>;
    } catch (error) {
      console.error('Error fetching doctor followers:', error);
      throw error;
    }
  }

  /**
   * Get parents following current user (doctor)
   */
  static async getMyFollowers(
    page: number = 1,
    perPage: number = 10
  ): Promise<ApiResponse<PaginatedResponse<ParentInfo>>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PERSONAL.MY_FOLLOWERS, {
        params: { page, per_page: perPage }
      });
      return response.data as ApiResponse<PaginatedResponse<ParentInfo>>;
    } catch (error) {
      console.error('Error fetching my followers:', error);
      throw error;
    }
  }

  /**
   * Get follow statistics
   */
  static async getFollowStats(userId: number): Promise<ApiResponse<FollowStats>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PERSONAL.FOLLOW_STATS(userId));
      return response.data as ApiResponse<FollowStats>;
    } catch (error) {
      console.error('Error fetching follow stats:', error);
      throw error;
    }
  }

  /**
   * Get dashboard summary
   */
  static async getDashboard(userId: number): Promise<ApiResponse<DashboardData>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PERSONAL.DASHBOARD(userId));
      return response.data as ApiResponse<DashboardData>;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  }

  /**
   * Get current user's dashboard
   */
  static async getMyDashboard(): Promise<ApiResponse<DashboardData>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PERSONAL.MY_DASHBOARD);
      return response.data as ApiResponse<DashboardData>;
    } catch (error) {
      console.error('Error fetching my dashboard:', error);
      throw error;
    }
  }
}

// ✅ Export default
export default PersonalService;