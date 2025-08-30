import React, { useState, useEffect } from 'react';
import {
  FileText, Search, Filter, Eye, Check, X, Clock, Edit,
  AlertCircle, User, Calendar, Tag, MoreVertical, RefreshCw,
  ChevronDown, ChevronUp, MessageCircle
} from 'lucide-react';

// ✅ Article interface cho admin
interface AdminArticle {
  article_id: number;
  title: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  featured: boolean;
  author_id: number;
  author: {
    id: number;
    username: string;
    full_name: string;
    avatar_url?: string;
    role_display: string;
  };
  category: string;
  tags: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  like_count: number;
  views: number;
  comment_count: number;
  reading_time: number;
  featured_image?: string;
  rejection_reason?: string;
  admin_notes?: string;
}

interface ArticlesResponse {
  success: boolean;
  data: AdminArticle[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
}

// ✅ REAL API SERVICE - Thay thế mock service
const adminArticleService = {
  async getArticles(filters: any = {}): Promise<ArticlesResponse> {
    try {
      console.log('🔍 Loading articles with filters:', filters);

      // Build query parameters
      const params = new URLSearchParams();

      // Add filters
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.author) params.append('author', filters.author);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      // Default pagination
      if (!params.has('page')) params.append('page', '1');
      if (!params.has('limit')) params.append('limit', '10');

      const response = await fetch(`http://localhost:8000/api/admin/articles?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Articles loaded:', data);

      return {
        success: true,
        data: data.data || [],
        pagination: data.pagination || {
          current_page: 1,
          per_page: 10,
          total: 0,
          total_pages: 0,
          has_more: false
        }
      };
    } catch (error) {
      console.error('❌ Error loading articles:', error);
      throw error;
    }
  },

  async updateArticleStatus(articleId: number, status: string, reason?: string): Promise<{success: boolean, message: string}> {
    try {
      console.log(`🔄 Updating article ${articleId} status to: ${status}`, { reason });

      const requestBody: any = { status };
      if (reason) {
        requestBody.rejection_reason = reason;
      }

      const response = await fetch(`http://localhost:8000/api/admin/articles/${articleId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Article status updated:', data);

      return {
        success: true,
        message: data.message || `Bài viết đã được ${status === 'published' ? 'duyệt' : status === 'rejected' ? 'từ chối' : 'cập nhật'} thành công!`
      };
    } catch (error) {
      console.error('❌ Error updating article status:', error);
      throw error;
    }
  },

  async getArticleDetail(articleId: number): Promise<AdminArticle> {
    try {
      console.log(`🔍 Loading article detail: ${articleId}`);

      const response = await fetch(`http://localhost:8000/api/admin/articles/${articleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Article detail loaded:', data);

      return data.data;
    } catch (error) {
      console.error('❌ Error loading article detail:', error);
      throw error;
    }
  },

  // ✅ NEW: Get admin stats
  async getStats() {
    try {
      console.log('📊 Loading admin articles stats...');

      const response = await fetch(`http://localhost:8000/api/admin/articles/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Admin stats loaded:', data);

      return data;
    } catch (error) {
      console.error('❌ Error loading admin stats:', error);
      throw error;
    }
  }
};

// ✅ Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <Check className="w-3 h-3 mr-1" />;
      case 'pending':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'rejected':
        return <X className="w-3 h-3 mr-1" />;
      case 'draft':
        return <Edit className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Đã duyệt';
      case 'pending': return 'Chờ duyệt';
      case 'rejected': return 'Từ chối';
      case 'draft': return 'Bản nháp';
      default: return status;
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(status)}`}>
      {getStatusIcon(status)}
      {getStatusText(status)}
    </span>
  );
};

// ✅ Article Actions Dropdown
const ArticleActionsDropdown: React.FC<{
  article: AdminArticle;
  onAction: (action: string, articleId: number) => void;
}> = ({ article, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Thao tác"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[180px] py-1">
            <button
              onClick={() => {
                onAction('view', article.article_id);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <Eye className="w-4 h-4 text-blue-600" />
              Xem chi tiết
            </button>

            {article.status === 'pending' && (
              <>
                <button
                  onClick={() => {
                    onAction('approve', article.article_id);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-3 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Duyệt bài
                </button>

                <button
                  onClick={() => {
                    onAction('reject', article.article_id);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Từ chối
                </button>
              </>
            )}

            {article.status === 'published' && (
              <button
                onClick={() => {
                  onAction('unpublish', article.article_id);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50 flex items-center gap-3 transition-colors"
              >
                <Clock className="w-4 h-4" />
                Hủy xuất bản
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ✅ Article Detail Modal
const ArticleDetailModal: React.FC<{
  article: AdminArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, articleId: number, reason?: string) => void;
}> = ({ article, isOpen, onClose, onAction }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!isOpen || !article) return null;

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onAction('reject', article.article_id, rejectionReason);
      setRejectionReason('');
      setShowRejectForm(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Chi tiết bài viết</h2>
            <StatusBadge status={article.status} />
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Article Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{article.title}</h1>

              {article.featured_image && (
                <img
                  src={article.featured_image}
                  alt={article.title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}

              <div className="prose max-w-none">
                <p className="text-gray-600 text-lg mb-4">{article.excerpt}</p>
                <div className="text-gray-800" dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br>') }} />
              </div>
            </div>

            <div className="space-y-6">
              {/* Author Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Thông tin tác giả</h3>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={article.author.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40"}
                    alt={article.author.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{article.author.full_name}</p>
                    <p className="text-sm text-gray-500">@{article.author.username}</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {article.author.role_display}
                </span>
              </div>

              {/* Article Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Thống kê</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lượt xem:</span>
                    <span className="font-medium">{article.views}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lượt thích:</span>
                    <span className="font-medium">{article.like_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bình luận:</span>
                    <span className="font-medium">{article.comment_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thời gian đọc:</span>
                    <span className="font-medium">{article.reading_time} phút</span>
                  </div>
                </div>
              </div>

              {/* Meta Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Thông tin khác</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Danh mục:</span>
                    <span className="ml-2 font-medium">{article.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tags:</span>
                    <span className="ml-2 font-medium">{article.tags}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Ngày tạo:</span>
                    <span className="ml-2 font-medium">
                      {new Date(article.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  {article.published_at && (
                    <div>
                      <span className="text-gray-600">Ngày xuất bản:</span>
                      <span className="ml-2 font-medium">
                        {new Date(article.published_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Info */}
              {article.status === 'rejected' && article.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-900 mb-2">Lý do từ chối</h3>
                  <p className="text-sm text-red-700">{article.rejection_reason}</p>
                  {article.admin_notes && (
                    <div className="mt-2">
                      <p className="text-xs text-red-600 font-medium">Ghi chú admin:</p>
                      <p className="text-sm text-red-700">{article.admin_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {article.status === 'pending' && (
            <div className="border-t border-gray-200 pt-6">
              {!showRejectForm ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => onAction('approve', article.article_id)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Duyệt bài viết
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Từ chối
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lý do từ chối <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Nhập lý do từ chối bài viết..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={!rejectionReason.trim()}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Xác nhận từ chối
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason('');
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ Main Admin Articles Management Component - ENHANCED
const AdminArticlesManagement: React.FC = () => {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<AdminArticle | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ✅ NEW: Add stats state
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    published: number;
    rejected: number;
    draft: number;
  } | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    category: '',
    author: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
    has_more: false
  });

  // ✅ ENHANCED: Load articles with better error handling
  const loadArticles = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminArticleService.getArticles({
        ...filters,
        page,
        limit: pagination.per_page
      });

      setArticles(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('❌ Error loading articles:', err);
      const errorMessage = (err as Error).message || 'Không thể tải danh sách bài viết';
      setError(errorMessage);

      // Show user-friendly error
      if (errorMessage.includes('403') || errorMessage.includes('Unauthorized')) {
        setError('Bạn không có quyền truy cập. Vui lòng đăng nhập với quyền admin.');
      } else if (errorMessage.includes('500')) {
        setError('Lỗi server. Vui lòng thử lại sau.');
      } else if (errorMessage.includes('404')) {
        setError('API không tìm thấy. Vui lòng kiểm tra server backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Load stats
  const loadStats = async () => {
    try {
      const response = await adminArticleService.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('❌ Error loading stats:', err);
      // Don't show error for stats, just log it
    }
  };

  // ✅ ENHANCED: Initial load with stats
  useEffect(() => {
    console.log('🚀 AdminArticlesManagement mounted, loading data...');
    loadArticles();
    loadStats();
  }, []);

  // Reload when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadArticles(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // ✅ ENHANCED: Handle article actions with real API
  const handleArticleAction = async (action: string, articleId: number, reason?: string) => {
    try {
      let status = '';
      switch (action) {
        case 'approve':
          status = 'published';
          break;
        case 'reject':
          status = 'rejected';
          break;
        case 'unpublish':
          status = 'pending';
          break;
        case 'view':
          // Load real article detail
          try {
            const article = await adminArticleService.getArticleDetail(articleId);
            setSelectedArticle(article);
            setShowDetailModal(true);
          } catch (err) {
            console.error('❌ Error loading article detail:', err);
            alert('Không thể tải chi tiết bài viết: ' + (err as Error).message);
          }
          return;
      }

      const response = await adminArticleService.updateArticleStatus(articleId, status, reason);

      if (response.success) {
        // Update local state
        setArticles(articles.map(article =>
          article.article_id === articleId
            ? {
                ...article,
                status: status as any,
                rejection_reason: reason,
                updated_at: new Date().toISOString()
              }
            : article
        ));

        // Reload stats
        loadStats();

        alert(response.message);

        // Close modal if open
        if (showDetailModal) {
          setShowDetailModal(false);
          setSelectedArticle(null);
        }
      }
    } catch (err) {
      console.error('❌ Error updating article:', err);
      alert('Có lỗi xảy ra: ' + (err as Error).message);
    }
  };

  // Filter change handlers
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // ✅ ENHANCED: Get counts from real data
  const pendingCount = articles.filter(article => article.status === 'pending').length;
  const publishedCount = articles.filter(article => article.status === 'published').length;
  const rejectedCount = articles.filter(article => article.status === 'rejected').length;
  const draftCount = articles.filter(article => article.status === 'draft').length;

  // ✅ ENHANCED: Render with better error handling
  if (error && !loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <button
              onClick={() => {
                setError(null);
                loadArticles();
                loadStats();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Thử lại
            </button>
            <button
              onClick={() => window.location.href = '/admin'}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Về Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Enhanced with real stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Quản lý bài viết (Real API)
              </h1>
              <p className="text-gray-600 mt-2">
                Duyệt và quản lý các bài viết từ database
                {pendingCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {pendingCount} bài chờ duyệt
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => {
                loadArticles();
                loadStats();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Làm mới
            </button>
          </div>
        </div>

        {/* Quick Stats - Enhanced with real data */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng bài viết</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total || pagination.total}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.pending || pendingCount}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã duyệt</p>
                <p className="text-2xl font-bold text-green-600">{stats?.published || publishedCount}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Từ chối</p>
                <p className="text-2xl font-bold text-red-600">{stats?.rejected || rejectedCount}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <X className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="published">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
                <option value="draft">Bản nháp</option>
              </select>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả danh mục</option>
                <option value="Chăm sóc trẻ em">Chăm sóc trẻ em</option>
                <option value="Thai sản">Thai sản</option>
                <option value="Vaccine">Vaccine</option>
                <option value="Dinh dưỡng">Dinh dưỡng</option>
                <option value="Sức khỏe">Sức khỏe</option>
              </select>

              {/* Author Filter */}
              <select
                value={filters.author}
                onChange={(e) => handleFilterChange('author', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả tác giả</option>
                <option value="doctor">Bác sĩ</option>
                <option value="parent">Phụ huynh</option>
              </select>
            </div>
          </div>
        </div>

        {/* Articles Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bài viết
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tác giả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thống kê
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  // Loading skeleton
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-6 py-4">
                        <div className="animate-pulse flex space-x-4">
                          <div className="rounded bg-gray-200 h-12 w-12"></div>
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : articles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <FileText className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          Không tìm thấy bài viết nào
                        </p>
                        <p className="text-gray-500">
                          {filters.search || filters.status || filters.category || filters.author
                            ? 'Thử thay đổi bộ lọc để xem kết quả khác'
                            : 'Chưa có bài viết nào trong hệ thống'
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  articles.map((article) => (
                    <tr key={article.article_id} className="hover:bg-gray-50 transition-colors">
                      {/* Article Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            {article.featured_image ? (
                              <img
                                src={article.featured_image}
                                alt={article.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {article.title}
                              </h3>
                              {article.featured && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Nổi bật
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {article.excerpt}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                              <span>{article.reading_time} phút đọc</span>
                              <span>•</span>
                              <span>#{article.article_id}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={article.author.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40"}
                            alt={article.author.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {article.author.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {article.author.role_display}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={article.status} />
                        {article.status === 'rejected' && article.rejection_reason && (
                          <div className="mt-1">
                            <div className="group relative">
                              <AlertCircle className="w-4 h-4 text-red-400 cursor-help" />
                              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block">
                                <div className="bg-black text-white text-xs rounded py-1 px-2 max-w-xs">
                                  {article.rejection_reason}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{article.category}</div>
                        {article.tags && (
                          <div className="text-xs text-gray-500 mt-1">
                            {article.tags.split(',').slice(0, 2).map((tag, index) => (
                              <span key={index} className="inline-block mr-1">
                                #{tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(article.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                        {article.published_at && (
                          <div className="text-xs text-green-600 mt-1">
                            Xuất bản: {new Date(article.published_at).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </td>

                      {/* Stats */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{article.views}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>{article.comment_count}</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <ArticleActionsDropdown
                          article={article}
                          onAction={handleArticleAction}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-700">
                Hiển thị {((pagination.current_page - 1) * pagination.per_page) + 1} đến {' '}
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} trong số {pagination.total} bài viết
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadArticles(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white"
                >
                  Trước
                </button>
                <span className="px-3 py-1 text-sm bg-white border border-gray-300 rounded">
                  Trang {pagination.current_page} / {pagination.total_pages}
                </span>
                <button
                  onClick={() => loadArticles(pagination.current_page + 1)}
                  disabled={!pagination.has_more}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Message - Enhanced */}
        {error && articles.length > 0 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-sm text-yellow-700">Cảnh báo: {error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Article Detail Modal */}
      <ArticleDetailModal
        article={selectedArticle}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedArticle(null);
        }}
        onAction={handleArticleAction}
      />
    </div>
  );
};

export default AdminArticlesManagement;