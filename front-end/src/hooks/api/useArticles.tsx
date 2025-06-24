import { useState, useEffect, useCallback } from 'react';
import type { Article, ArticleFilters, ArticlePaginationData } from '../../types/content.types';

// Return type for useArticles hook - matching the usage in both ArticlesList and ArticlesListPage
export interface UseArticlesReturn {
  articles: Article[];
  loading: boolean; // Keep as 'loading' for ArticlesList compatibility
  isLoading: boolean; // Also provide 'isLoading' for ArticlesListPage compatibility
  error: string | null;
  pagination: ArticlePaginationData | null;
  fetchArticles: (filters?: ArticleFilters) => Promise<void>;
  refetch: () => void;
  clearError: () => void;
}

/**
 * Hook for managing articles data fetching and state
 */
export const useArticles = (initialFilters: ArticleFilters = { limit: 10, page: 1 }): UseArticlesReturn => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ArticlePaginationData | null>(null);
  const [currentFilters, setCurrentFilters] = useState<ArticleFilters>(initialFilters);

  // Mock fetch function - replace with actual API call
  const fetchArticles = useCallback(async (filters: ArticleFilters = currentFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Replace with actual API service call
      // const response = await articleService.getArticles(filters);

      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock articles data
      const mockArticles: Article[] = [
        {
          article_id: 1,
          title: "Chăm sóc sức khỏe trẻ em trong mùa đông",
          content: "Nội dung bài viết...",
          excerpt: "Hướng dẫn chăm sóc sức khỏe trẻ em hiệu quả trong mùa đông lạnh",
          category: "Sức khỏe trẻ em",
          featured_image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=200&fit=crop",
          created_at: new Date().toISOString(),
          author: {
            id: 1,
            user_id: 1,
            username: "dr_nguyen",
            full_name: "BS. Nguyễn Văn A",
            verified: true
          },
          interactions: {
            likes: 45,
            views: 1200,
            comments_count: 8
          },
          userInteractions: {
            isLiked: false,
            isSaved: false
          },
          reading_time: 5
        },
        {
          article_id: 2,
          title: "Dinh dưỡng cho trẻ phát triển toàn diện",
          content: "Nội dung bài viết...",
          excerpt: "Những nguyên tắc dinh dưỡng cơ bản giúp trẻ phát triển khỏe mạnh",
          category: "Dinh dưỡng",
          featured_image: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=200&fit=crop",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          author: {
            id: 2,
            user_id: 2,
            username: "dr_tran",
            full_name: "BS. Trần Thị B",
            verified: true
          },
          interactions: {
            likes: 32,
            views: 980,
            comments_count: 12
          },
          userInteractions: {
            isLiked: true,
            isSaved: false
          },
          reading_time: 7
        },
        {
          article_id: 3,
          title: "Phát triển tâm lý trẻ em qua các giai đoạn",
          content: "Nội dung bài viết...",
          excerpt: "Hiểu rõ các giai đoạn phát triển tâm lý để hỗ trợ trẻ tốt nhất",
          category: "Phát triển tâm lý",
          featured_image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=200&fit=crop",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          author: {
            id: 3,
            user_id: 3,
            username: "dr_pham",
            full_name: "BS. Phạm Văn C",
            verified: true
          },
          interactions: {
            likes: 28,
            views: 750,
            comments_count: 5
          },
          userInteractions: {
            isLiked: false,
            isSaved: true
          },
          reading_time: 6
        }
      ];

      const mockResponse = {
        data: mockArticles,
        pagination: {
          current_page: filters.page || 1,
          per_page: filters.limit || 10,
          total: mockArticles.length,
          total_pages: 1,
          has_more: false
        } as ArticlePaginationData
      };

      setArticles(mockResponse.data);
      setPagination(mockResponse.pagination);
      setCurrentFilters(filters);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch articles');
    } finally {
      setIsLoading(false);
    }
  }, [currentFilters]);

  const refetch = useCallback(() => {
    fetchArticles(currentFilters);
  }, [fetchArticles, currentFilters]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchArticles(initialFilters);
  }, [fetchArticles, initialFilters]);

  return {
    articles,
    loading: isLoading, // Provide both for compatibility
    isLoading, // Also provide isLoading
    error,
    pagination,
    fetchArticles,
    refetch,
    clearError
  };
};