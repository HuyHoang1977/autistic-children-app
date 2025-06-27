// src/pages/articles/ArticlesListPage.tsx - UPDATED với API thật
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { Alert, AlertDescription } from "../../components/ui/alert";
import {
  Search,
  Grid,
  List,
  TrendingUp,
  Calendar,
  Heart,
  Eye,
  Plus,
  Loader2,
  SlidersHorizontal,
  MessageCircle,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";
import { useArticles } from "../../hooks/api/useArticles";
import { useArticlesDebug } from "../../hooks/api/useArticlesDebug";
import { useAuth } from "../../hooks/auth/useAuth";
import { toast } from "sonner";
import type { ArticleFilters, Article } from "../../types/content.types";

// ✅ Enhanced Article Card Component cho Articles List
interface SimpleArticleCardProps {
  article: Article;
  variant?: 'default' | 'list';
  onLike?: (articleId: number, liked: boolean) => void;
  onSave?: (articleId: number, saved: boolean) => void;
  onShare?: (articleId: number) => void;
}

const SimpleArticleCard: React.FC<SimpleArticleCardProps> = ({
  article,
  variant = 'default',
  onLike,
  onSave,
  onShare
}) => {
  const isListView = variant === 'list';

  const handleLike = () => {
    const newLikedState = !article.userInteractions?.isLiked;
    onLike?.(article.article_id, newLikedState);
  };

  const handleSave = () => {
    const newSavedState = !article.userInteractions?.isSaved;
    onSave?.(article.article_id, newSavedState);
  };

  const handleShare = () => {
    onShare?.(article.article_id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <Link to={`/articles/${article.article_id}`}>
      <Card className={`${isListView ? 'flex flex-row' : ''} hover:shadow-lg transition-shadow cursor-pointer group`}>
        {/* Featured Image */}
        {article.featured_image && (
          <div className={`${isListView ? 'w-48 flex-shrink-0' : 'w-full h-48'} bg-gray-200 rounded-t-lg overflow-hidden`}>
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}

        <div className={`${isListView ? 'flex-1' : ''}`}>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Category Badge */}
              {article.category && (
                <Badge variant="secondary" className="text-xs">
                  {article.category}
                </Badge>
              )}

              {/* Title and Excerpt */}
              <div>
                <h3 className={`font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors ${isListView ? 'text-xl' : 'text-lg'}`}>
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-gray-600 text-sm mt-2 line-clamp-3">
                    {article.excerpt}
                  </p>
                )}
              </div>

              {/* Author Info */}
              {article.author && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {article.author.full_name.charAt(0)}
                  </div>
                  <span>{article.author.full_name}</span>
                  {article.author.verified && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
              )}

              {/* Interaction Stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLike();
                    }}
                    className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                      article.userInteractions?.isLiked ? 'text-red-500' : ''
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${article.userInteractions?.isLiked ? 'fill-current' : ''}`} />
                    {article.interactions.likes}
                  </button>

                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {article.interactions.views || 0}
                  </span>

                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {article.interactions.comments_count || 0}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSave();
                    }}
                    className={`text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors ${
                      article.userInteractions?.isSaved ? 'bg-blue-100 text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {article.userInteractions?.isSaved ? 'Đã lưu' : 'Lưu'}
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleShare();
                    }}
                    className="text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors text-gray-500"
                  >
                    Chia sẻ
                  </button>
                </div>
              </div>

              {/* Date and Reading Time */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{formatDate(article.created_at)}</span>
                {article.reading_time && (
                  <span>{article.reading_time} phút đọc</span>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
};

// ✅ MAIN COMPONENT
const ArticlesListPage: React.FC = () => {
  const { user } = useAuth();
  const debug = useArticlesDebug();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState<'created_at' | 'published_at' | 'likes' | 'views' | 'title' | 'updated_at'>("published_at");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("desc");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(12);

  // ✅ Article filters for API
  const [articleFilters, setArticleFilters] = useState<ArticleFilters>({
    limit,
    page: currentPage,
    search: "",
    category: "",
    sort_by: sortBy,
    sort_order: sortOrder,
    status: "published"
  });

  // ✅ Use REAL API hook
  const {
    articles,
    isLoading,
    error,
    pagination,
    refetch
  } = useArticles(articleFilters);

  // Categories
  const categories = [
    { value: "", label: "Tất cả danh mục" },
    { value: "Sức khỏe trẻ em", label: "Sức khỏe trẻ em" },
    { value: "Dinh dưỡng", label: "Dinh dưỡng" },
    { value: "Phát triển tâm lý", label: "Phát triển tâm lý" },
    { value: "Bệnh lý thường gặp", label: "Bệnh lý thường gặp" },
    { value: "Chăm sóc sơ sinh", label: "Chăm sóc sơ sinh" },
    { value: "Giáo dục sức khỏe", label: "Giáo dục sức khỏe" }
  ];

  const sortOptions = [
    { value: "published_at", label: "Mới nhất" },
    { value: "likes", label: "Nhiều lượt thích" },
    { value: "views", label: "Nhiều lượt xem" },
    { value: "created_at", label: "Ngày tạo" }
  ];

  // ✅ Apply filters when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setArticleFilters({
        limit,
        page: currentPage,
        search: searchQuery,
        category: selectedCategory,
        sort_by: sortBy,
        sort_order: sortOrder,
        status: "published"
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory, sortBy, sortOrder, currentPage, limit]);

  // Reset page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, selectedCategory, sortBy, sortOrder]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as typeof sortBy);
  };

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value as 'asc' | 'desc');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleArticleLike = (articleId: number, liked: boolean) => {
    toast.success(liked ? 'Đã thích bài viết' : 'Đã bỏ thích');
  };

  const handleArticleSave = (articleId: number, saved: boolean) => {
    toast.success(saved ? 'Đã lưu bài viết' : 'Đã bỏ lưu');
  };

  const handleArticleShare = (articleId: number) => {
    toast.success('Đã chia sẻ bài viết');
  };

  // ✅ Connection status indicator
  const renderConnectionStatus = () => {
    const isConnected = debug.debugInfo.apiConnection === 'connected';
    const isAuthenticated = debug.debugInfo.authStatus === 'authenticated';

    return (
      <div className="flex items-center gap-2 text-sm">
        {isConnected ? (
          <div className="flex items-center gap-1 text-green-600">
            <Wifi className="h-4 w-4" />
            <span>API Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-red-600">
            <WifiOff className="h-4 w-4" />
            <span>API Disconnected</span>
          </div>
        )}

        {isAuthenticated ? (
          <Badge variant="default" className="text-xs">Authenticated</Badge>
        ) : (
          <Badge variant="destructive" className="text-xs">Not Authenticated</Badge>
        )}
      </div>
    );
  };

  const renderPagination = () => {
    if (!pagination || pagination.total_pages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const currentPageNum = pagination.current_page;
    const totalPages = pagination.total_pages;

    let startPage = Math.max(1, currentPageNum - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPageNum > 1) {
      pages.push(
        <Button
          key="prev"
          variant="outline"
          onClick={() => handlePageChange(currentPageNum - 1)}
          className="px-3 py-2"
        >
          Trước
        </Button>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPageNum ? "default" : "outline"}
          onClick={() => handlePageChange(i)}
          className="px-3 py-2"
        >
          {i}
        </Button>
      );
    }

    // Next button
    if (currentPageNum < totalPages) {
      pages.push(
        <Button
          key="next"
          variant="outline"
          onClick={() => handlePageChange(currentPageNum + 1)}
          className="px-3 py-2"
        >
          Tiếp
        </Button>
      );
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        {pages}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* ✅ Enhanced Header with Connection Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bài viết về sức khỏe
            </h1>
            <p className="text-gray-600">
              Khám phá kiến thức y tế từ các chuyên gia hàng đầu
            </p>

            {/* ✅ Connection Status */}
            <div className="mt-2">
              {renderConnectionStatus()}
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-3">
            {user && (
              <Link to="/articles/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Viết bài mới
                </Button>
              </Link>
            )}

            <Button
              variant="outline"
              onClick={refetch}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* ✅ Error Handling */}
        {error && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={refetch}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Filters & Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            {/* Main search bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm bài viết..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Bộ lọc
                </Button>

                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Advanced filters */}
            {showFilters && (
              <>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Danh mục</label>
                    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Sắp xếp theo</label>
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Thứ tự</label>
                    <Select value={sortOrder} onValueChange={handleSortOrderChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Giảm dần</SelectItem>
                        <SelectItem value="asc">Tăng dần</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ✅ Results Summary */}
        {pagination && (
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-600">
              Hiển thị {((pagination.current_page - 1) * pagination.per_page) + 1} - {" "}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} của {" "}
              {pagination.total} bài viết
            </div>

            {searchQuery && (
              <Badge variant="secondary">
                Kết quả cho: "{searchQuery}"
              </Badge>
            )}
          </div>
        )}

        {/* ✅ Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Đang tải bài viết từ API...</span>
          </div>
        )}

        {/* ✅ Articles Grid/List */}
        {!isLoading && (
          <>
            {articles && articles.length > 0 ? (
              <div className={
                viewMode === 'grid'
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-6"
              }>
                {articles.map((article) => (
                  <SimpleArticleCard
                    key={article.article_id}
                    article={article}
                    variant={viewMode === 'list' ? 'list' : 'default'}
                    onLike={handleArticleLike}
                    onSave={handleArticleSave}
                    onShare={handleArticleShare}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Không tìm thấy bài viết
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery
                      ? `Không có bài viết nào phù hợp với "${searchQuery}"`
                      : error
                        ? "Có lỗi khi tải dữ liệu từ API"
                        : "Không có bài viết nào trong danh mục này"
                    }
                  </p>

                  {(searchQuery || error) && (
                    <div className="flex justify-center gap-2">
                      {searchQuery && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("");
                          }}
                        >
                          Xóa bộ lọc
                        </Button>
                      )}

                      {error && (
                        <Button
                          variant="outline"
                          onClick={refetch}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Thử lại
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pagination */}
            {renderPagination()}
          </>
        )}

        {/* ✅ Quick Stats (chỉ hiển thị khi có dữ liệu) */}
        {!isLoading && articles && articles.length > 0 && (
          <Card className="mt-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Thống kê tương tác
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {articles.reduce((sum, article) => sum + article.interactions.likes, 0)}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Heart className="h-4 w-4" />
                    Lượt thích
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {articles.reduce((sum, article) => sum + (article.interactions.views || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Eye className="h-4 w-4" />
                    Lượt xem
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {articles.reduce((sum, article) => sum + (article.interactions.comments_count || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    Bình luận
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {articles.length}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Bài viết
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ Debug Panel - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🔍 Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="font-semibold">API Status</div>
                    <div className={`${debug.debugInfo.apiConnection === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                      {debug.debugInfo.apiConnection}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold">Auth Status</div>
                    <div className={`${debug.debugInfo.authStatus === 'authenticated' ? 'text-green-600' : 'text-red-600'}`}>
                      {debug.debugInfo.authStatus}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold">API Calls</div>
                    <div>{debug.apiCalls.total} ({debug.apiCalls.successful} success)</div>
                  </div>

                  <div>
                    <div className="font-semibold">Cache Size</div>
                    <div>{debug.cacheStatus.size} items</div>
                  </div>
                </div>

                {debug.debugInfo.lastError && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <div className="text-xs text-red-700">
                      <strong>Last Error:</strong> {debug.debugInfo.lastError}
                    </div>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={debug.runHealthCheck}
                    className="text-xs"
                  >
                    Run Health Check
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={debug.clearCache}
                    className="text-xs"
                  >
                    Clear Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesListPage;