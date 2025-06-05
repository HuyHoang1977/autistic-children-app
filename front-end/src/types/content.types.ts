import type { UserRole } from "./user.types"

// Base Content từ bảng CONTENTS
export interface BaseContent {
  content_id: number
  author_id: number
  content_type: string
  created_at: Date
  updated_at: Date
  view_count: number
  like_count: number
  comment_count: number
  share_count: number
  is_published: boolean
}

// Article từ bảng ARTICLES
export interface Article extends BaseContent {
  article_id: number
  title: string
  excerpt: string
  content: string
  featured_image?: string
  reading_time: number

  // Thông tin tác giả
  author: {
    user_id: number
    username: string
    first_name: string
    last_name: string
    avatar_url?: string
    role: UserRole
    specialty?: string
    verified?: boolean
  }

  // Categories và Tags
  categories?: Category[]
  tags?: Tag[]

  // Interaction counts
  interactions: {
    likes: number
    comments: number
    shares: number
    views: number
  }

  // User interaction status
  userInteractions?: {
    isLiked: boolean
    isSaved: boolean
  }
}

// Comment từ bảng COMMENTS
export interface Comment {
  comment_id: number
  content_id: number
  user_id: number
  parent_comment_id?: number
  content: string
  created_at: Date
  updated_at: Date
  like_count: number

  // Thông tin người comment
  author: {
    user_id: number
    username: string
    first_name: string
    last_name: string
    avatar_url?: string
    role: UserRole
    specialty?: string
  }

  // Nested replies
  replies?: Comment[]

  // User interaction
  isLiked?: boolean
}

// Like từ bảng LIKES
export interface Like {
  like_id: number
  user_id: number
  content_id?: number
  comment_id?: number
  created_at: Date
}

// Category từ bảng CATEGORIES
export interface Category {
  category_id: number
  name: string
  description?: string
  slug: string
  parent_category_id?: number
  sort_order: number
  is_active: boolean
  children?: Category[]
  article_count?: number
}

// Tag từ bảng TAGS
export interface Tag {
  tag_id: number
  name: string
  description?: string
  slug: string
  usage_count: number
  created_at: Date
}

// Create/Update types
export interface CreateArticleRequest {
  title: string
  excerpt: string
  content: string
  featured_image?: string
  category_ids: number[]
  tag_ids: number[]
  is_published: boolean
}

export interface CreateCommentRequest {
  content_id: number
  content: string
  parent_comment_id?: number
}
