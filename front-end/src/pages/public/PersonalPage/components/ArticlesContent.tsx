import React from 'react';
import { Article } from '../../../../api/services/personal.service';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Skeleton } from '../../../../components/ui/skeleton';
import { Calendar, Heart, MessageCircle, Eye, BookOpen } from 'lucide-react';

interface ArticlesContentProps {
  articles: Article[];
  pagination: any;
  loading: boolean;
  error: string | null;
  onLoadMore: () => void;
  onLoadPrevious: () => void;
  navigate: (path: string) => void;
}

const ArticlesContent: React.FC<ArticlesContentProps> = ({ 
  articles, 
  pagination, 
  loading, 
  error, 
  onLoadMore, 
  onLoadPrevious, 
  navigate 
}) => {
  console.log('ArticlesContent Debug:', {
    articles: articles?.length,
    pagination: pagination?.total,
    loading,
    error,
    articlesData: articles
  });

  const handleArticleClick = (article: Article) => {
    navigate(`/articles/${article.article_id}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center text-red-600">
          <p>Lỗi khi tải bài viết: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chưa có bài viết</h3>
          <p className="text-gray-600">Người dùng này chưa đăng bài viết nào.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map(article => (
        <Card 
          key={article.article_id} 
          className="hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30"
          onClick={() => handleArticleClick(article)}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">{article.title}</h3>
              <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                {article.status === 'published' ? 'Đã đăng' : 'Bản nháp'}
              </Badge>
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {article.excerpt || article.content?.substring(0, 150) + '...' || 'Không có nội dung'}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {article.views || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {article.like_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {article.comment_count || 0}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                📅 {new Date(article.created_at).toLocaleDateString('vi-VN')}
              </span>
              {article.tags && (
                <div className="flex gap-1">
                  {article.tags.split(',').slice(0, 3).map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Simple Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button 
            onClick={onLoadPrevious} 
            disabled={!pagination.has_prev}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.current_page} of {pagination.pages}
          </span>
          <Button 
            onClick={onLoadMore} 
            disabled={!pagination.has_next}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default ArticlesContent;
