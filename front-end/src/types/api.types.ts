// API Response wrapper
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: Record<string, string[]>
}

// Paginated response
export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    total_pages: number
    has_more: boolean
  }
}

// Error response
export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
  status_code: number
}

// Search/Filter params
export interface SearchParams {
  page?: number
  limit?: number
  search?: string
  sort_by?: string
  sort_order?: "asc" | "desc"
}

export interface ArticleFilters extends SearchParams {
  category_id?: number
  tag_ids?: number[]
  author_id?: number
  is_published?: boolean
}
