import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Clock, Check, X, Edit, Eye, AlertCircle,
  Calendar, User, MessageCircle, Heart, Share2, Filter,
  Search, RefreshCw, Plus, BookOpen, Star, ArrowRight,
  TrendingUp, BarChart3, Users, Globe, PenTool, Archive
} from 'lucide-react';

// ✅ Types & Interfaces
interface UserArticle {
  article_id: number;
  title: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  featured: boolean;
  category: string;
  tags: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  reviewed_at?: string;
  like_count: number;
  views: number;
  comment_count: number;
  reading_time: number;
  featured_image?: string;
  rejection_reason?: string;
  admin_notes?: string;
  author?: {
    id: number;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface ArticleFilters {
  status: string;
  search: string;
  category: string;
  sort_by: string;
  sort_order: string;
}

interface ArticleStats {
  total: number;
  published: number;
  pending: number;
  rejected: number;
  draft: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
}

interface PaginationInfo {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}

// ✅ Real API Service
const userArticleService = {
  async getMyArticles(filters: Partial<ArticleFilters> = {}, page: number = 1): Promise<{
    success: boolean;
    data: UserArticle[];
    pagination: PaginationInfo;
    message?: string;
  }> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      });

      const response = await fetch(`http://localhost:8000/api/articles/my-articles?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching my articles:', error);
      throw error;
    }
  },

  async deleteArticle(articleId: number): Promise<{ success: boolean; message: string }> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`http://localhost:8000/api/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete article');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  },

  async resubmitArticle(articleId: number): Promise<{ success: boolean; message: string }> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`http://localhost:8000/api/articles/${articleId}/resubmit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to resubmit article');
      }

      return await response.json();
    } catch (error) {
      console.error('Error resubmitting article:', error);
      throw error;
    }
  },

  async getArticleStats(): Promise<ArticleStats> {
    // This would be a separate endpoint in real implementation
    try {
      const response = await this.getMyArticles({}, 1);
      const articles = response.data;

      return {
        total: articles.length,
        published: articles.filter(a => a.status === 'published').length,
        pending: articles.filter(a => a.status === 'pending').length,
        rejected: articles.filter(a => a.status === 'rejected').length,
        draft: articles.filter(a => a.status === 'draft').length,
        total_views: articles.reduce((sum, a) => sum + a.views, 0),
        total_likes: articles.reduce((sum, a) => sum + a.like_count, 0),
        total_comments: articles.reduce((sum, a) => sum + a.comment_count, 0),
      };
    } catch (error) {
      console.error('Error getting article stats:', error);
      return {
        total: 0, published: 0, pending: 0, rejected: 0, draft: 0,
        total_views: 0, total_likes: 0, total_comments: 0
      };
    }
  }
};

// ✅ Status Badge Component
const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'published':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <Check className="w-3 h-3 mr-1" />,
          text: 'Đã xuất bản',
          description: 'Bài viết đã được duyệt và công khai'
        };
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="w-3 h-3 mr-1" />,
          text: 'Chờ duyệt',
          description: 'Đang chờ admin xem xét và duyệt'
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <X className="w-3 h-3 mr-1" />,
          text: 'Bị từ chối',
          description: 'Cần chỉnh sửa theo yêu cầu của admin'
        };
      case 'draft':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Edit className="w-3 h-3 mr-1" />,
          text: 'Bản nháp',
          description: 'Chưa hoàn thành, có thể tiếp tục chỉnh sửa'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: null,
          text: status,
          description: ''
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center ${sizeClasses} rounded-full font-medium border ${config.color}`}
      title={config.description}
    >
      {config.icon}
      {config.text}
    </span>
  );
};

// ✅ Article Card Component
const ArticleCard: React.FC<{
  article: UserArticle;
  onAction: (action: string, articleId: number) => void;
  isLoading?: boolean;
}> = ({ article, onAction, isLoading = false }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      await onAction(action, article.article_id);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusMessage = (article: UserArticle) => {
    switch (article.status) {
      case 'pending':
        const daysSinceSubmitted = Math.floor(
          (new Date().getTime() - new Date(article.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        return `Bài viết đang chờ admin duyệt (${daysSinceSubmitted} ngày). Thời gian duyệt thường từ 1-3 ngày làm việc.`;
      case 'published':
        return `Bài viết đã được xuất bản${article.published_at ? ` vào ${new Date(article.published_at).toLocaleDateString('vi-VN')}` : ''}.`;
      case 'rejected':
        return 'Bài viết đã bị từ chối. Bạn có thể chỉnh sửa và gửi lại để được xem xét.';
      case 'draft':
        return 'Bản nháp - Bạn có thể tiếp tục chỉnh sửa và gửi duyệt khi hoàn thành.';
      default:
        return '';
    }
  };

  const getActionButtons = () => {
    const buttons = [];

    if (article.status === 'draft') {
      buttons.push(
        <button
          key="edit"
          onClick={() => handleAction('edit')}
          disabled={actionLoading === 'edit'}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          {actionLoading === 'edit' ? (
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Edit className="w-3 h-3" />
          )}
          Chỉnh sửa
        </button>
      );
    }

    if (article.status === 'rejected') {
      buttons.push(
        <button
          key="resubmit"
          onClick={() => handleAction('resubmit')}
          disabled={actionLoading === 'resubmit'}
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          {actionLoading === 'resubmit' ? (
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <ArrowRight className="w-3 h-3" />
          )}
          Gửi lại
        </button>
      );
    }

    if (article.status === 'published') {
      buttons.push(
        <button
          key="view"
          onClick={() => handleAction('view')}
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
        >
          <Globe className="w-3 h-3" />
          Xem bài viết
        </button>
      );
    }

    if (['draft', 'rejected'].includes(article.status)) {
      buttons.push(
        <button
          key="delete"
          onClick={() => handleAction('delete')}
          disabled={actionLoading === 'delete'}
          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          {actionLoading === 'delete' ? (
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <X className="w-3 h-3" />
          )}
          Xóa
        </button>
      );
    }

    return buttons;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="w-20 h-20 bg-gray-200 rounded-lg ml-4"></div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {article.title}
              </h3>
              <StatusBadge status={article.status} />
              {article.featured && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Star className="w-3 h-3 mr-1" />
                  Nổi bật
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {article.excerpt}
            </p>
          </div>

          {article.featured_image && (
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-20 h-20 object-cover rounded-lg ml-4 flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          )}
        </div>

        {/* Article Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(article.created_at).toLocaleDateString('vi-VN')}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{article.reading_time} phút đọc</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{article.views.toLocaleString()} lượt xem</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span>{article.like_count.toLocaleString()} lượt thích</span>
          </div>
        </div>

        {/* Category & Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {article.category}
          </span>
          {article.tags && article.tags.split(',').slice(0, 3).map((tag, index) => (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              #{tag.trim()}
            </span>
          ))}
        </div>

        {/* Status Message */}
        <div className={`p-3 rounded-lg text-sm mb-4 ${
          article.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
          article.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
          article.status === 'published' ? 'bg-green-50 text-green-700 border border-green-200' :
          'bg-gray-50 text-gray-700 border border-gray-200'
        }`}>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{getStatusMessage(article)}</span>
          </div>
        </div>

        {/* Rejection Details */}
        {article.status === 'rejected' && article.rejection_reason && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-1">Lý do từ chối:</p>
            <p className="text-sm text-red-700">{article.rejection_reason}</p>
            {article.admin_notes && (
              <div className="mt-2">
                <p className="text-xs font-medium text-red-800">Ghi chú từ admin:</p>
                <p className="text-sm text-red-700">{article.admin_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Performance Metrics for Published Articles */}
        {article.status === 'published' && (article.views > 0 || article.like_count > 0) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-1 text-sm font-medium text-blue-800 mb-2">
              <TrendingUp className="w-4 h-4" />
              Thống kê bài viết
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-blue-900">{article.views}</div>
                <div className="text-blue-600">Lượt xem</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-900">{article.like_count}</div>
                <div className="text-blue-600">Lượt thích</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-900">{article.comment_count}</div>
                <div className="text-blue-600">Bình luận</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showDetails ? 'Ẩn chi tiết' : 'Xem chi tiết'}
          </button>

          <div className="flex items-center gap-2">
            {getActionButtons()}
          </div>
        </div>

        {/* Detailed Stats */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Ngày tạo:</span>
                <p className="font-medium">{new Date(article.created_at).toLocaleString('vi-VN')}</p>
              </div>
              <div>
                <span className="text-gray-500">Cập nhật cuối:</span>
                <p className="font-medium">{new Date(article.updated_at).toLocaleString('vi-VN')}</p>
              </div>
              {article.published_at && (
                <div>
                  <span className="text-gray-500">Ngày xuất bản:</span>
                  <p className="font-medium">{new Date(article.published_at).toLocaleString('vi-VN')}</p>
                </div>
              )}
              {article.reviewed_at && (
                <div>
                  <span className="text-gray-500">Ngày duyệt:</span>
                  <p className="font-medium">{new Date(article.reviewed_at).toLocaleString('vi-VN')}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Từ khóa:</span>
                <p className="font-medium">{article.tags || 'Chưa có'}</p>
              </div>
              <div>
                <span className="text-gray-500">ID bài viết:</span>
                <p className="font-medium">#{article.article_id}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>
          {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString()}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
        color.includes('blue') ? 'bg-blue-100' :
        color.includes('green') ? 'bg-green-100' :
        color.includes('yellow') ? 'bg-yellow-100' :
        color.includes('red') ? 'bg-red-100' :
        'bg-gray-100'
      }`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </div>
);

// ✅ Main Component
const UserArticleManagement: React.FC = () => {
  const [articles, setArticles] = useState<UserArticle[]>([]);
  const [stats, setStats] = useState<ArticleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Filters & Pagination
  const [filters, setFilters] = useState<ArticleFilters>({
    status: '',
    search: '',
    category: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
    has_more: false
  });

  // Load articles
  const loadArticles = useCallback(async (page = 1, showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const response = await userArticleService.getMyArticles(filters, page);

      if (response.success) {
        setArticles(response.data);
        setPagination(response.pagination);
      } else {
        throw new Error(response.message || 'Failed to load articles');
      }
    } catch (err) {
      const errorMessage = (err as Error).message || 'Không thể tải danh sách bài viết';
      setError(errorMessage);
      console.error('Error loading articles:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const statsData = await userArticleService.getArticleStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    Promise.all([
      loadArticles(1, true),
      loadStats()
    ]);
  }, [loadArticles, loadStats]);

  // Reload when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadArticles(1, false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, loadArticles]);

  // Handle article actions
  const handleArticleAction = async (action: string, articleId: number) => {
    if (actionLoading === articleId) return;

    try {
      setActionLoading(articleId);

      switch (action) {
        case 'edit':
          window.location.href = `/articles/${articleId}/edit`;
          break;

        case 'view':
          window.open(`/articles/${articleId}`, '_blank');
          break;

        case 'delete':
          if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này? Thao tác này không thể hoàn tác.')) {
            const response = await userArticleService.deleteArticle(articleId);
            if (response.success) {
              setArticles(prev => prev.filter(a => a.article_id !== articleId));
              loadStats(); // Refresh stats

              // Show success message
              const toast = document.createElement('div');
              toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
              toast.textContent = response.message || 'Bài viết đã được xóa thành công!';
              document.body.appendChild(toast);
              setTimeout(() => document.body.removeChild(toast), 3000);
            }
          }
          break;

        case 'resubmit':
          if (window.confirm('Bạn có muốn gửi lại bài viết này để admin xem xét?')) {
            const response = await userArticleService.resubmitArticle(articleId);
            if (response.success) {
              // Update article status locally
              setArticles(prev => prev.map(article =>
                article.article_id === articleId
                  ? { ...article, status: 'pending' as const, updated_at: new Date().toISOString() }
                  : article
              ));
              loadStats(); // Refresh stats

              // Show success message
              const toast = document.createElement('div');
              toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
              toast.textContent = response.message || 'Bài viết đã được gửi lại để duyệt!';
              document.body.appendChild(toast);
              setTimeout(() => document.body.removeChild(toast), 3000);
            }
          }
          break;

        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (err) {
      const errorMessage = (err as Error).message || 'Có lỗi xảy ra khi thực hiện thao tác';

      // Show error message
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      toast.textContent = errorMessage;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);

      console.error(`Error performing ${action}:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof ArticleFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    loadArticles(page, false);
  };

  // Refresh data
  const handleRefresh = () => {
    Promise.all([
      loadArticles(pagination.current_page, true),
      loadStats()
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <PenTool className="w-8 h-8 text-blue-600" />
                Bài viết của tôi
              </h1>
              <p className="text-gray-600 mt-2">
                Quản lý và theo dõi trạng thái các bài viết của bạn
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
              <button
                onClick={() => window.location.href = '/articles/create'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Viết bài mới
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
            <StatsCard
              title="Tổng số bài"
              value={stats.total}
              icon={FileText}
              color="text-blue-600"
              subtitle="Tất cả bài viết"
            />
            <StatsCard
              title="Đã xuất bản"
              value={stats.published}
              icon={Check}
              color="text-green-600"
              subtitle="Có thể xem công khai"
            />
            <StatsCard
              title="Chờ duyệt"
              value={stats.pending}
              icon={Clock}
              color="text-yellow-600"
              subtitle="Đang chờ admin"
            />
            <StatsCard
              title="Bị từ chối"
              value={stats.rejected}
              icon={X}
              color="text-red-600"
              subtitle="Cần chỉnh sửa"
            />
            <StatsCard
              title="Bản nháp"
              value={stats.draft}
              icon={Edit}
              color="text-gray-600"
              subtitle="Chưa hoàn thành"
            />
            <StatsCard
              title="Lượt xem"
              value={stats.total_views}
              icon={Eye}
              color="text-purple-600"
              subtitle="Tổng lượt xem"
            />
            <StatsCard
              title="Lượt thích"
              value={stats.total_likes}
              icon={Heart}
              color="text-pink-600"
              subtitle="Tổng lượt thích"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết theo tiêu đề, nội dung..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="lg:w-48">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="published">Đã xuất bản</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="rejected">Bị từ chối</option>
                  <option value="draft">Bản nháp</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="lg:w-48">
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả danh mục</option>
                  <option value="Chăm sóc trẻ em">Chăm sóc trẻ em</option>
                  <option value="Thai sản">Thai sản</option>
                  <option value="Vaccine">Vaccine</option>
                  <option value="Dinh dưỡng">Dinh dưỡng</option>
                  <option value="Sức khỏe">Sức khỏe</option>
                </select>
              </div>

              {/* Sort */}
              <div className="lg:w-48">
                <select
                  value={`${filters.sort_by}-${filters.sort_order}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    handleFilterChange('sort_by', sortBy);
                    handleFilterChange('sort_order', sortOrder);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="created_at-desc">Mới nhất</option>
                  <option value="created_at-asc">Cũ nhất</option>
                  <option value="updated_at-desc">Cập nhật gần đây</option>
                  <option value="title-asc">Tiêu đề A-Z</option>
                  <option value="title-desc">Tiêu đề Z-A</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Articles List */}
        <div className="space-y-6">
          {loading && articles.length === 0 ? (
            // Loading skeleton
            [...Array(3)].map((_, i) => (
              <ArticleCard
                key={`loading-${i}`}
                article={{} as UserArticle}
                onAction={() => {}}
                isLoading={true}
              />
            ))
          ) : error ? (
            // Error state
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không thể tải dữ liệu
              </h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Thử lại
              </button>
            </div>
          ) : articles.length === 0 ? (
            // Empty state
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filters.search || filters.status || filters.category
                  ? 'Không tìm thấy bài viết phù hợp'
                  : 'Chưa có bài viết nào'
                }
              </h3>
              <p className="text-gray-500 mb-6">
                {filters.search || filters.status || filters.category
                  ? 'Thử thay đổi bộ lọc để xem kết quả khác hoặc tạo bài viết mới'
                  : 'Bạn chưa viết bài viết nào. Hãy bắt đầu viết bài đầu tiên!'
                }
              </p>
              <div className="flex items-center justify-center gap-4">
                {(filters.search || filters.status || filters.category) && (
                  <button
                    onClick={() => {
                      setFilters({
                        status: '',
                        search: '',
                        category: '',
                        sort_by: 'created_at',
                        sort_order: 'desc'
                      });
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Filter className="w-5 h-5" />
                    Xóa bộ lọc
                  </button>
                )}
                <button
                  onClick={() => window.location.href = '/articles/create'}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Viết bài mới
                </button>
              </div>
            </div>
          ) : (
            // Articles list
            articles.map((article) => (
              <ArticleCard
                key={article.article_id}
                article={article}
                onAction={handleArticleAction}
                isLoading={actionLoading === article.article_id}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị {((pagination.current_page - 1) * pagination.per_page) + 1} đến{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} trong số{' '}
              {pagination.total} bài viết
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1 || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white"
              >
                Trước
              </button>

              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  const page = i + 1;
                  const isActive = page === pagination.current_page;

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      disabled={loading}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      } disabled:opacity-50`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={!pagination.has_more || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white"
              >
                Sau
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions & Help */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Archive className="w-5 h-5 text-blue-600" />
              Thao tác nhanh
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/articles/create'}
                className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium">Tạo bài viết mới</div>
                  <div className="text-sm text-gray-500">Viết và chia sẻ kiến thức của bạn</div>
                </div>
              </button>

              <button
                onClick={() => setFilters(prev => ({ ...prev, status: 'draft' }))}
                className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium">Xem bản nháp</div>
                  <div className="text-sm text-gray-500">Hoàn thành các bài viết đang soạn</div>
                </div>
              </button>

              <button
                onClick={() => setFilters(prev => ({ ...prev, status: 'rejected' }))}
                className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-medium">Bài viết bị từ chối</div>
                  <div className="text-sm text-gray-500">Chỉnh sửa và gửi lại để duyệt</div>
                </div>
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">
              Hướng dẫn về trạng thái bài viết
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Edit className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Bản nháp:</span>
                  <span className="text-gray-600 ml-1">Bài viết chưa hoàn thành, có thể chỉnh sửa tự do</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Chờ duyệt:</span>
                  <span className="text-gray-600 ml-1">Đã gửi và đang chờ admin xem xét (1-3 ngày)</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Đã xuất bản:</span>
                  <span className="text-gray-600 ml-1">Bài viết đã được duyệt và hiển thị công khai</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Bị từ chối:</span>
                  <span className="text-gray-600 ml-1">Cần chỉnh sửa theo góp ý của admin rồi gửi lại</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-sm text-blue-700">
                💡 <strong>Mẹo:</strong> Để tăng tỷ lệ được duyệt, hãy đảm bảo nội dung chính xác,
                có nguồn tham khảo uy tín và tuân thủ quy định của cộng đồng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserArticleManagement;