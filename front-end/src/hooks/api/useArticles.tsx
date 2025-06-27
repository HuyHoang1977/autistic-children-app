// src/hooks/api/useArticles.ts - FIXED VERSION
import { useState, useEffect, useCallback } from 'react';
import { articleService } from '../../api/services/article.sevice';
import type { Article, ArticleFilters, ArticlePaginationData } from '../../types/content.types';

// ✅ FIXED: Match exact interface from your existing useArticles
interface UseArticlesReturn {
  articles: Article[];
  loading: boolean; // Keep as 'loading' for ArticlesList compatibility
  isLoading: boolean; // Also provide 'isLoading' for ArticlesListPage compatibility
  error: string | null;
  pagination: ArticlePaginationData | null;
  fetchArticles: (filters?: ArticleFilters) => Promise<void>;
  refetch: () => void;
  clearError: () => void;
}

export const useArticles = (initialFilters: ArticleFilters = { limit: 10, page: 1 }): UseArticlesReturn => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ArticlePaginationData | null>(null);
  const [currentFilters, setCurrentFilters] = useState<ArticleFilters>(initialFilters);

  // ✅ REAL API CALL - Replace mock with actual service
  const fetchArticles = useCallback(async (filters: ArticleFilters = currentFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 useArticles: Fetching REAL data with filters:', filters);

      // ✅ CALL REAL API SERVICE
      const response = await articleService.getArticles(filters);

      console.log('✅ useArticles: Real API response:', {
        success: response.success,
        dataLength: response.data?.length,
        pagination: response.pagination
      });

      if (response.success && response.data) {
        // ✅ Handle pagination mode
        if (filters.page && filters.page > 1) {
          // Load more mode - append to existing articles
          setArticles(prev => [...prev, ...response.data]);
        } else {
          // Fresh load mode - replace articles
          setArticles(response.data);
        }

        setPagination(response.pagination || null);
        setCurrentFilters(filters);
      } else {
        throw new Error(response.error || 'Failed to fetch articles');
      }

    } catch (err: any) {
      console.error('❌ useArticles: Real API error:', err);

      // ✅ Better error handling
      let errorMessage = 'Không thể tải bài viết';

      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        errorMessage = 'Vui lòng đăng nhập để xem bài viết';
      } else if (err.message?.includes('Network')) {
        errorMessage = 'Không thể kết nối đến server';
      } else if (err.message?.includes('Invalid user identity')) {
        errorMessage = 'Phiên đăng nhập không hợp lệ';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // ✅ Don't clear articles on error unless it's the first load
      if (!filters.page || filters.page === 1) {
        setArticles([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentFilters]);

  // ✅ Refetch current filters
  const refetch = useCallback(() => {
    fetchArticles(currentFilters);
  }, [fetchArticles, currentFilters]);

  // ✅ Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✅ Initial load - only run once on mount
  useEffect(() => {
    console.log('🔄 useArticles: Initial load with filters:', initialFilters);
    fetchArticles(initialFilters);
  }, []); // Empty dependency array - only run once

  return {
    articles,
    loading: isLoading, // Provide both for compatibility
    isLoading, // Also provide isLoading for ArticlesListPage
    error,
    pagination,
    fetchArticles,
    refetch,
    clearError
  };
};