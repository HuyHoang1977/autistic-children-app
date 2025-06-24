import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import { authService } from "./auth.service";

// Import updated types - FIXED: Import from correct paths với tên đã đổi
import type {
  Article,
  ArticleFilters,
  CreateArticleRequest,
  ArticlesResponse,
  ArticleApiResponse,
  ArticleInteraction,
  ArticleSave,
  ArticleShare,
} from "../../types/content.types";

// Request cache
const requestCache = new Map<string, Promise<any>>();
const CACHE_TIMEOUT = 5000;

// Create cache key
const createCacheKey = (url: string, params?: any): string => {
  const paramString = params ? JSON.stringify(params) : '';
  return `${url}:${paramString}`;
};

// Deduplication wrapper
const withDeduplication = <T>(
  requestFn: () => Promise<T>,
  cacheKey: string
): Promise<T> => {
  if (requestCache.has(cacheKey)) {
    console.log('🔄 Returning cached request for:', cacheKey);
    return requestCache.get(cacheKey)!;
  }

  const requestPromise = requestFn().finally(() => {
    setTimeout(() => {
      requestCache.delete(cacheKey);
    }, CACHE_TIMEOUT);
  });

  requestCache.set(cacheKey, requestPromise);
  return requestPromise;
};

// Validate filters - FIXED: Better type safety
const validateFilters = (filters: ArticleFilters): Record<string, any> => {
  const cleanFilters: Record<string, any> = {};

  cleanFilters.limit = filters.limit ? Math.min(Math.max(1, filters.limit), 100) : 10;
  cleanFilters.page = filters.page ? Math.max(1, filters.page) : 1;

  if (filters.category_id && filters.category_id > 0) {
    cleanFilters.category_id = filters.category_id;
  }
  if (filters.author_id && filters.author_id > 0) {
    cleanFilters.author_id = filters.author_id;
  }
  if (filters.search?.trim()) {
    cleanFilters.search = filters.search.trim();
  }
  if (filters.sort_by) {
    cleanFilters.sort_by = filters.sort_by;
  }
  if (filters.sort_order) {
    cleanFilters.sort_order = filters.sort_order;
  }
  if (filters.featured !== undefined) {
    cleanFilters.featured = filters.featured;
  }
  if (filters.status) {
    cleanFilters.status = filters.status;
  }

  return cleanFilters;
};

// Extract error messages
const extractErrorMessages = (responseData: any): string[] => {
  const messages: string[] = [];

  if (responseData?.error) {
    messages.push(responseData.error);
  }

  if (responseData?.message && responseData.message !== responseData?.error) {
    messages.push(responseData.message);
  }

  if (responseData?.errors && Array.isArray(responseData.errors)) {
    responseData.errors.forEach((err: any) => {
      if (typeof err === 'string') {
        messages.push(err);
      } else if (typeof err === 'object' && err.field && err.message) {
        messages.push(`${err.field}: ${err.message}`);
      }
    });
  }

  return messages.length > 0 ? messages : ['Unknown error occurred'];
};

// Handle API errors
const handleApiError = (error: any, operation: string): string => {
  console.error(`❌ Error in ${operation}:`, error);

  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 401:
        authService.clearTokens();
        return 'Unauthorized: Please log in again';

      case 403:
        return 'Forbidden: You do not have permission';

      case 404:
        return 'Not found: Resource does not exist';

      case 422:
        const validationErrors = extractErrorMessages(data);
        return `Validation Error: ${validationErrors.join('; ')}`;

      case 429:
        return 'Too many requests: Please try again later';

      case 500:
        return 'Server error: Please try again later';

      default:
        const errorMessages = extractErrorMessages(data);
        return errorMessages.join('; ') || `${operation} failed`;
    }
  }

  if (!error.response) {
    return 'Network error: Unable to connect to server';
  }

  return error.message || `${operation} failed`;
};

export const articleService = {
  /**
   * Get articles with pagination and filters
   */
  async getArticles(filters: ArticleFilters = {}): Promise<ArticlesResponse> {
    const cacheKey = createCacheKey('articles', filters);

    return withDeduplication(async () => {
      console.log('📡 Fetching articles with filters:', filters);

      try {
        // Check authentication
        const token = authService.getToken();
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        // Validate and clean filters
        const cleanFilters = validateFilters(filters);
        console.log('📋 Clean filters:', cleanFilters);

        // Make API request
        const response = await apiClient.get<ArticlesResponse>(API_ENDPOINTS.ARTICLES.LIST, {
          params: cleanFilters,
          timeout: 15000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });

        // Access response data directly
        const responseData = response.data;

        console.log('✅ Articles response:', {
          success: responseData?.success,
          dataLength: responseData?.data?.length
        });

        // Check if response has required structure
        if (!responseData || typeof responseData.success !== 'boolean') {
          throw new Error('Invalid response format from server');
        }

        if (!responseData.success) {
          const errorMessages = extractErrorMessages(responseData);
          throw new Error(errorMessages.join('; '));
        }

        // Return response with fallbacks
        return {
          success: true,
          data: responseData.data || [],
          pagination: responseData.pagination || {
            current_page: cleanFilters.page || 1,
            per_page: cleanFilters.limit || 10,
            total: 0,
            total_pages: 0,
            has_more: false
          },
          message: responseData.message,
          error: responseData.error
        };

      } catch (error: any) {
        const errorMessage = handleApiError(error, 'getArticles');
        throw new Error(errorMessage);
      }
    }, cacheKey);
  },

  /**
   * Get article detail by ID
   */
  async getArticleDetail(article_id: number): Promise<Article> {
    const cacheKey = createCacheKey(`article-${article_id}`);

    return withDeduplication(async () => {
      try {
        console.log('📡 Fetching article detail:', article_id);

        if (!article_id || article_id <= 0) {
          throw new Error('Invalid article ID');
        }

        const response = await apiClient.get<ArticleApiResponse<Article>>(
          API_ENDPOINTS.ARTICLES.DETAIL(article_id)
        );
        const responseData = response.data;

        if (!responseData?.success || !responseData?.data) {
          const errorMessages = extractErrorMessages(responseData);
          throw new Error(errorMessages.join('; ') || 'Article not found');
        }

        return responseData.data;
      } catch (error: any) {
        const errorMessage = handleApiError(error, 'getArticleDetail');
        throw new Error(errorMessage);
      }
    }, cacheKey);
  },

  /**
   * Create new article
   */
  async createArticle(articleData: CreateArticleRequest): Promise<Article> {
    try {
      console.log('📡 Creating article:', articleData.title);

      if (!articleData.title?.trim()) {
        throw new Error('Article title is required');
      }

      const response = await apiClient.post<ArticleApiResponse<Article>>(
        API_ENDPOINTS.ARTICLES.CREATE,
        articleData
      );
      const responseData = response.data;

      if (!responseData?.success || !responseData?.data) {
        const errorMessages = extractErrorMessages(responseData);
        throw new Error(errorMessages.join('; ') || 'Failed to create article');
      }

      requestCache.clear();
      return responseData.data;
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'createArticle');
      throw new Error(errorMessage);
    }
  },

  /**
   * Update article
   */
  async updateArticle(article_id: number, articleData: Partial<CreateArticleRequest>): Promise<Article> {
    try {
      console.log('📡 Updating article:', article_id);

      if (!article_id || article_id <= 0) {
        throw new Error('Invalid article ID');
      }

      const response = await apiClient.put<ArticleApiResponse<Article>>(
        API_ENDPOINTS.ARTICLES.UPDATE(article_id),
        articleData
      );
      const responseData = response.data;

      if (!responseData?.success || !responseData?.data) {
        const errorMessages = extractErrorMessages(responseData);
        throw new Error(errorMessages.join('; ') || 'Failed to update article');
      }

      requestCache.clear();
      return responseData.data;
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'updateArticle');
      throw new Error(errorMessage);
    }
  },

  /**
   * Delete article
   */
  async deleteArticle(article_id: number): Promise<void> {
    try {
      console.log('📡 Deleting article:', article_id);

      if (!article_id || article_id <= 0) {
        throw new Error('Invalid article ID');
      }

      await apiClient.delete(API_ENDPOINTS.ARTICLES.DELETE(article_id));
      requestCache.clear();
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'deleteArticle');
      throw new Error(errorMessage);
    }
  },

  /**
   * Toggle like on article
   */
  async toggleLike(content_id: number): Promise<ArticleInteraction> {
    try {
      console.log('📡 Toggling like for content:', content_id);

      if (!content_id || content_id <= 0) {
        throw new Error('Invalid content ID');
      }

      const response = await apiClient.post<ArticleApiResponse<ArticleInteraction>>(
        API_ENDPOINTS.ARTICLES.TOGGLE_LIKE(content_id)
      );
      const responseData = response.data;

      if (!responseData?.success || !responseData?.data) {
        const errorMessages = extractErrorMessages(responseData);
        throw new Error(errorMessages.join('; ') || 'Failed to toggle like');
      }

      return responseData.data;
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'toggleLike');
      throw new Error(errorMessage);
    }
  },

  /**
   * Toggle save on article
   */
  async toggleSave(article_id: number): Promise<ArticleSave> {
    try {
      console.log('📡 Toggling save for article:', article_id);

      if (!article_id || article_id <= 0) {
        throw new Error('Invalid article ID');
      }

      const response = await apiClient.post<ArticleApiResponse<ArticleSave>>(
        API_ENDPOINTS.ARTICLES.SAVE(article_id)
      );
      const responseData = response.data;

      if (!responseData?.success || !responseData?.data) {
        const errorMessages = extractErrorMessages(responseData);
        throw new Error(errorMessages.join('; ') || 'Failed to toggle save');
      }

      return responseData.data;
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'toggleSave');
      throw new Error(errorMessage);
    }
  },

  /**
   * Share article - FIXED: Added missing method
   */
  async shareArticle(article_id: number, platform?: string): Promise<ArticleShare> {
    try {
      console.log('📡 Sharing article:', article_id, platform);

      if (!article_id || article_id <= 0) {
        throw new Error('Invalid article ID');
      }

      const response = await apiClient.post<ArticleApiResponse<ArticleShare>>(
        API_ENDPOINTS.ARTICLES.SHARE(article_id),
        { platform }
      );
      const responseData = response.data;

      if (!responseData?.success || !responseData?.data) {
        const errorMessages = extractErrorMessages(responseData);
        throw new Error(errorMessages.join('; ') || 'Failed to share article');
      }

      return responseData.data;
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'shareArticle');
      throw new Error(errorMessage);
    }
  },

  /**
   * Get user's articles
   */
  async getMyArticles(): Promise<Article[]> {
    try {
      console.log('📡 Fetching my articles');

      const response = await apiClient.get<ArticleApiResponse<Article[]>>(
        API_ENDPOINTS.ARTICLES.MY_ARTICLES
      );
      const responseData = response.data;

      return responseData?.data || [];
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'getMyArticles');
      throw new Error(errorMessage);
    }
  },

  /**
   * Get saved articles
   */
  async getSavedArticles(): Promise<Article[]> {
    try {
      console.log('📡 Fetching saved articles');

      const response = await apiClient.get<ArticleApiResponse<Article[]>>(
        API_ENDPOINTS.ARTICLES.SAVED_ARTICLES
      );
      const responseData = response.data;

      return responseData?.data || [];
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'getSavedArticles');
      throw new Error(errorMessage);
    }
  },

  /**
   * Get articles from followed doctors
   */
  async getFollowedDoctorsArticles(): Promise<Article[]> {
    try {
      console.log('📡 Fetching followed doctors articles');

      const response = await apiClient.get<ArticleApiResponse<Article[]>>(
        API_ENDPOINTS.ARTICLES.FOLLOWED_DOCTORS
      );
      const responseData = response.data;

      return responseData?.data || [];
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'getFollowedDoctorsArticles');
      throw new Error(errorMessage);
    }
  },

  /**
   * Get featured articles
   */
  async getFeaturedArticles(): Promise<Article[]> {
    try {
      console.log('📡 Fetching featured articles');

      const response = await apiClient.get<ArticleApiResponse<Article[]>>(
        API_ENDPOINTS.ARTICLES.FEATURED
      );
      const responseData = response.data;

      return responseData?.data || [];
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'getFeaturedArticles');
      throw new Error(errorMessage);
    }
  },

  /**
   * Get trending articles
   */
  async getTrendingArticles(): Promise<Article[]> {
    try {
      console.log('📡 Fetching trending articles');

      const response = await apiClient.get<ArticleApiResponse<Article[]>>(
        API_ENDPOINTS.ARTICLES.TRENDING
      );
      const responseData = response.data;

      return responseData?.data || [];
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'getTrendingArticles');
      throw new Error(errorMessage);
    }
  },

  /**
   * Clear cache
   */
  clearCache(): void {
    requestCache.clear();
    console.log('🧹 Article service cache cleared');
  },

  /**
   * Get cache status
   */
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: requestCache.size,
      keys: Array.from(requestCache.keys())
    };
  },

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing API connection...');

      const token = authService.getToken();
      if (!token) {
        console.log('❌ No authentication token found');
        return false;
      }

      const response = await apiClient.get(API_ENDPOINTS.ARTICLES.LIST, {
        params: { limit: 1, page: 1 },
        timeout: 10000
      });

      console.log('✅ API connection test successful:', response.status);
      return true;
    } catch (error: any) {
      console.error('❌ API connection test failed:', error);
      return false;
    }
  }
};