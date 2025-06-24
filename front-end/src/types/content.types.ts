// Content and Article related types

// Import SearchParams from api.types to avoid duplication
import type { SearchParams } from './api.types';

export interface Article {
  // Primary identifiers - FIXED: Made id optional since backend uses article_id
  id?: number; // Optional for compatibility
  article_id: number; // Primary backend identifier
  content_id?: number;

  // Content
  title: string;
  content: string;
  content_body?: string; // Backend field name
  excerpt?: string; // Optional as in original

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
  reading_time?: number; // Optional with default fallback

  // Engagement metrics - FIXED: Made views, shares, comments_count optional with fallbacks
  interactions: {
    likes: number;
    views?: number; // Optional with fallback to 0
    shares?: number; // Optional with fallback to 0
    comments_count?: number; // Optional with fallback to 0
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

// FIXED: Extended ArticleFilters with more specific sort_by values
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
  // FIXED: More specific union type to prevent string assignment error
  sort_by?: 'created_at' | 'published_at' | 'likes' | 'views' | 'title' | 'updated_at';
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
  status?: 'draft' | 'published' | 'archived'; // FIXED: Specific values instead of string
  featured?: boolean;
  allow_comments?: boolean;
}

// Response types for API
export interface ArticleInteraction {
  liked: boolean;
  like_count: number;
}

export interface ArticleSave {
  saved: boolean;
}

// FIXED: Add ArticleShare type that was missing
export interface ArticleShare {
  share_count: number;
}

// FIXED: Add pagination data interface - RENAMED to avoid conflicts
export interface ArticlePaginationData {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}

// FIXED: Response wrappers - using different names to avoid conflicts
export interface ArticleApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ArticlesResponse {
  success: boolean;
  data: Article[];
  pagination: ArticlePaginationData;
  message?: string;
  error?: string;
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

// Comments - RENAMED to avoid conflicts
export interface ArticleComment {
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
  replies?: ArticleComment[];
}

// FIXED: Add comment request types - RENAMED to avoid conflicts
export interface CreateArticleCommentRequest {
  content_id: number;
  comment_text: string;
  parent_comment_id?: number;
}

export interface UpdateArticleCommentRequest {
  comment_text: string;
}

// FIXED: Helper to create safe article with defaults
export interface SafeArticle extends Omit<Article, 'interactions'> {
  interactions: {
    likes: number;
    views: number;
    shares: number;
    comments_count: number;
    comments?: number;
  };
  reading_time: number;
  excerpt: string;
}

// FIXED: Helper function to convert Article to SafeArticle
export const toSafeArticle = (article: Article): SafeArticle => ({
  ...article,
  interactions: {
    likes: article.interactions.likes || 0,
    views: article.interactions.views || 0,
    shares: article.interactions.shares || 0,
    comments_count: article.interactions.comments_count || 0,
    comments: article.interactions.comments,
  },
  reading_time: article.reading_time || 5,
  excerpt: article.excerpt || '',
});

// FIXED: Article form data interface
export interface ArticleFormData extends CreateArticleRequest {
  id?: number;
  article_id?: number;
}