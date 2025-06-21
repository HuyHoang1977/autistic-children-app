// Content and Article related types

// Import SearchParams from api.types to avoid duplication
import type { SearchParams } from './api.types';

export interface Article {
  // Primary identifiers
  id: number;
  article_id: number; // Backend compatibility
  content_id?: number;

  // Content
  title: string;
  content: string;
  content_body?: string; // Backend field name
  excerpt?: string;

  // Media
  featured_image?: string;
  featured_image_url?: string; // Alternative field name
  media_attachments?: string;

  // Author information
  author_id?: number;
  author?: {
    id: number;
    user_id: number; // Add user_id for profile links
    username: string;
    full_name: string;
    avatar_url?: string;
    role_id?: number; // Add role_id for doctor verification
    verified?: boolean; // Add verified status for doctors
  };

  // Categories (array for multiple categories)
  category?: string; // Single category string
  categories?: Array<{
    category_id: number;
    name: string;
    slug: string;
  }>; // Multiple categories

  // Timestamps
  created_at: string;
  updated_at?: string;
  published_at?: string;

  // Status and metadata
  status?: string; // 'draft', 'published', 'archived'
  article_status?: number; // Backend uses numbers: 1=draft, 2=published, 3=archived
  featured?: boolean;
  tags?: string;
  slug?: string;
  meta_description?: string;
  reading_time?: number;

  // Engagement metrics
  interactions: {
    likes: number;
    views?: number;
    shares?: number;
    comments_count?: number;
    comments?: number; // Alternative naming
  };

  // Backend compatibility fields
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  views?: number;
  view_count?: number; // Add view_count field

  // User-specific interactions
  userInteractions: {
    isLiked: boolean;
    isSaved: boolean;
    hasViewed?: boolean;
  };

  // Settings
  allow_comments?: boolean;
}

export interface ArticleFilters extends SearchParams {
  category_id?: number;
  tag_ids?: number[];
  author_id?: number;
  is_published?: boolean;
  // Legacy fields for backward compatibility
  category?: string;
  status?: string;
  featured?: boolean;
  search?: string;
  tags?: string[];
  sort_by?: 'created_at' | 'published_at' | 'likes' | 'views';
  sort_order?: 'asc' | 'desc';
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  tags?: string;
  featured_image_url?: string;
  meta_description?: string;
  status?: string;
  featured?: boolean;
  allow_comments?: boolean;
}

// Remove PaginatedResponse from here since it's in api.types

export interface ArticleInteraction {
  liked: boolean;
  like_count: number;
}

export interface ArticleSave {
  saved: boolean;
}

// Content categories
export interface ContentCategory {
  category_id: number;
  name: string;
  description?: string;
  slug: string;
  parent_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Content tags
export interface ContentTag {
  tag_id: number;
  name: string;
  slug: string;
  description?: string;
  usage_count: number;
  created_at: string;
}

// Comments
export interface Comment {
  comment_id: number;
  content_id: number;
  user_id: number;
  parent_comment_id?: number;
  comment_text: string;
  is_approved: boolean;
  like_count: number;
  created_at: string;
  updated_at: string;

  // User info
  user?: {
    user_id: number;
    username: string;
    full_name: string;
    avatar_url?: string;
  };

  // Replies
  replies?: Comment[];
}