import React, { memo } from 'react';
import { useArticles, useArticlesDebug } from '../../hooks/useArticles';
import ArticleCard from '../../components/content/ArticleCard/ArticleCard';
import type { ArticleFilters } from '../../types/content.types';

interface ArticlesListProps {
  filters?: ArticleFilters;
  variant?: 'default' | 'featured' | 'compact';
}

const ArticlesList: React.FC<ArticlesListProps> = memo(({
  filters = { limit: 10, page: 1 },
  variant = 'default'
}) => {
  const {
    articles,
    loading,
    error,
    pagination,
    fetchArticles,
    refetch,
    clearError
  } = useArticles(filters);

  const { cacheStatus } = useArticlesDebug();

  // Handle retry
  const handleRetry = () => {
    clearError();
    refetch();
  };

  // Handle load more
  const handleLoadMore = () => {
    if (pagination?.has_more) {
      fetchArticles({
        ...filters,
        page: (pagination.current_page || 1) + 1,
      });
    }
  };

  if (loading && articles.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang tải bài viết...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <p className="font-medium">Có lỗi xảy ra khi tải bài viết</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Thử lại
        </button>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-xs">
            <p><strong>Cache Status:</strong></p>
            <p>Size: {cacheStatus.size}</p>
            <p>Keys: {cacheStatus.keys.join(', ')}</p>
          </div>
        )}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Không có bài viết nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Articles Grid */}
      <div className={`grid gap-6 ${
        variant === 'compact' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1 md:grid-cols-2'
      }`}>
        {articles.map((article) => (
          <ArticleCard
            key={`${article.id}-${article.article_id}`} // Unique key
            article={article}
            variant={variant}
          />
        ))}
      </div>

      {/* Loading more indicator */}
      {loading && articles.length > 0 && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <span className="text-sm text-gray-600 mt-2">Đang tải thêm...</span>
        </div>
      )}

      {/* Load more button */}
      {pagination && pagination.has_more && !loading && (
        <div className="text-center py-4">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Tải thêm bài viết
          </button>
        </div>
      )}

      {/* Pagination info */}
      {pagination && (
        <div className="text-center text-sm text-gray-600">
          Trang {pagination.current_page} / {pagination.total_pages}
          ({pagination.total} bài viết)
        </div>
      )}
    </div>
  );
});

ArticlesList.displayName = 'ArticlesList';

export default ArticlesList;