import { useState, useEffect, useCallback, useRef } from 'react';
import { articleService } from '../../src/api/services/article.sevice';
import type { Article, ArticleFilters, PaginatedResponse } from '../types';

interface UseArticlesState {
  articles: Article[];
  loading: boolean;
  error: string | null;
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  } | null;
}

interface UseArticlesReturn extends UseArticlesState {
  fetchArticles: (filters?: ArticleFilters) => Promise<void>;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useArticles = (initialFilters: ArticleFilters = {}): UseArticlesReturn => {
  const [state, setState] = useState<UseArticlesState>({
    articles: [],
    loading: false,
    error: null,
    pagination: null,
  });

  // Keep track of current request to prevent race conditions
  const currentRequestRef = useRef<AbortController | null>(null);
  const lastFiltersRef = useRef<string>('');

  const fetchArticles = useCallback(async (filters: ArticleFilters = {}) => {
    // Prevent duplicate requests with same filters
    const filtersKey = JSON.stringify(filters);
    if (lastFiltersRef.current === filtersKey && state.loading) {
      console.log('🚫 Preventing duplicate request with same filters');
      return;
    }

    // Cancel previous request if still pending
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    currentRequestRef.current = abortController;
    lastFiltersRef.current = filtersKey;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      console.log('📡 Fetching articles with filters:', filters);

      const response: PaginatedResponse<Article> = await articleService.getArticles(filters);

      // Check if request was aborted
      if (abortController.signal.aborted) {
        console.log('🚫 Request was aborted');
        return;
      }

      console.log('✅ Articles fetched successfully:', response);

      setState(prev => ({
        ...prev,
        articles: response.data,
        pagination: response.pagination,
        loading: false,
        error: null,
      }));

    } catch (error: any) {
      // Don't update state if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      console.error('❌ Failed to fetch articles:', error);

      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch articles',
      }));
    } finally {
      currentRequestRef.current = null;
    }
  }, [state.loading]);

  const refetch = useCallback(async () => {
    // Clear cache and fetch again
    articleService.clearCache();
    await fetchArticles(initialFilters);
  }, [fetchArticles, initialFilters]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchArticles(initialFilters);

    // Cleanup function to abort ongoing requests
    return () => {
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
      }
    };
  }, []); // Empty dependency array for initial fetch only

  return {
    ...state,
    fetchArticles,
    refetch,
    clearError,
  };
};

// Hook for debugging
export const useArticlesDebug = () => {
  const cacheStatus = articleService.getCacheStatus();

  return {
    cacheStatus,
    clearCache: articleService.clearCache,
  };
};