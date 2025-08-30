import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, UserCheck, UserX, Shield, User, Eye, Activity,
  AlertCircle, Trash2, MoreVertical, Settings, RefreshCw, Download,
  XCircle, Database, AlertTriangle, FileText, BarChart3,
  MessageSquare, Calendar, ChevronRight, Grid3X3, Menu, X
} from 'lucide-react';

// ✅ Interface definitions
interface SimpleUser {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  is_active: boolean;
  role_id: number;
  role_display: string;
  status_display: string;
  last_activity?: string;
}

interface SimpleUsersResponse {
  success: boolean;
  data: SimpleUser[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
}

interface SimpleStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    recent_signups: number;
  };
  users_by_role: {
    admins: number;
    doctors: number;
    parents: number;
  };
  content: {
    total_articles: number;
    published_articles: number;
    total_comments: number;
  };
}

// ✅ NEW: Deletion info interface
interface DeletionInfo {
  user_info: {
    user_id: number;
    username: string;
    email: string;
    full_name: string;
    role_id: number;
    role_display: string;
  };
  related_data: {
    comments?: number;
    articles?: number;
    appointments?: number;
    likes?: number;
    saves?: number;
    followers?: number;
    following?: number;
    admin_profile?: boolean;
    doctor_profile?: boolean;
    parent_profile?: boolean;
  };
  warnings: string[];
  can_delete: boolean;
}

// ✅ NEW: Admin Menu Items
const adminMenuItems = [
  {
    id: 'dashboard',
    label: 'Tổng quan',
    icon: BarChart3,
    path: '/admin',
    description: 'Thống kê tổng quan hệ thống'
  },
  {
    id: 'users',
    label: 'Quản lý người dùng',
    icon: Users,
    path: '/admin/users',
    description: 'Quản lý tài khoản người dùng'
  },
  {
    id: 'articles',
    label: 'Quản lý bài viết',
    icon: FileText,
    path: '/admin/articles',
    description: 'Duyệt và quản lý bài viết'
  },
  {
    id: 'comments',
    label: 'Quản lý bình luận',
    icon: MessageSquare,
    path: '/admin/comments',
    description: 'Kiểm duyệt bình luận',
    disabled: true
  },
  {
    id: 'reports',
    label: 'Báo cáo',
    icon: BarChart3,
    path: '/admin/reports',
    description: 'Báo cáo chi tiết',
    disabled: true
  },
  {
    id: 'settings',
    label: 'Cài đặt hệ thống',
    icon: Settings,
    path: '/admin/settings',
    description: 'Cấu hình hệ thống',
    disabled: true
  }
];

// ✅ Enhanced admin service with hard delete
const adminService = {
  async getUsers(params: Record<string, string> = {}): Promise<SimpleUsersResponse> {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`http://localhost:8000/api/admin/users?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  async updateUserStatus(userId: number, isActive: boolean) {
    const response = await fetch(`http://localhost:8000/api/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_active: isActive })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // ✅ Soft delete (deactivate)
  async deleteUser(userId: number) {
    const response = await fetch(`http://localhost:8000/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 403) {
        if (errorData.error_code === 'SELF_DELETION_DENIED') {
          throw new Error('Không thể xóa tài khoản của chính mình');
        }
        throw new Error('Không có quyền thực hiện thao tác này');
      }

      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // ✅ NEW: Hard delete (permanent removal)
  async hardDeleteUser(userId: number) {
    const response = await fetch(`http://localhost:8000/api/admin/users/${userId}/hard-delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 403) {
        if (errorData.error_code === 'SELF_DELETION_DENIED') {
          throw new Error('Không thể xóa tài khoản của chính mình');
        }
        throw new Error('Không có quyền thực hiện thao tác này');
      }

      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // ✅ NEW: Get deletion info
  async getDeletionInfo(userId: number) {
    const response = await fetch(`http://localhost:8000/api/admin/users/${userId}/deletion-info`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  async getStats() {
    const response = await fetch(`http://localhost:8000/api/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }
};

// ✅ NEW: Admin Navigation Sidebar
const AdminSidebar: React.FC<{
  currentPage: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ currentPage, onNavigate, isOpen, onToggle }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-4 px-2">
          <div className="space-y-1">
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.path;
              const isDisabled = item.disabled;

              return (
                <button
                  key={item.id}
                  onClick={() => !isDisabled && onNavigate(item.path)}
                  disabled={isDisabled}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                      : isDisabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.label}</div>
                    <div className="text-xs text-gray-500 truncate">{item.description}</div>
                  </div>
                  {!isDisabled && (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  {isDisabled && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Quick Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="space-y-2">
            <button
              onClick={() => onNavigate('/admin/articles')}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Quản lý bài viết
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Xem trang chủ
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ✅ NEW: Quick Action Cards
const QuickActionCards: React.FC<{
  onNavigate: (path: string) => void;
  stats: SimpleStats | null;
}> = ({ onNavigate, stats }) => {
  const quickActions = [
    {
      title: 'Quản lý bài viết',
      description: 'Duyệt và quản lý bài viết từ người dùng',
      icon: FileText,
      path: '/admin/articles',
      color: 'blue',
      stats: stats?.content ? {
        total: stats.content.total_articles,
        pending: stats.content.total_articles - stats.content.published_articles
      } : null
    },
    {
      title: 'Quản lý người dùng',
      description: 'Quản lý tài khoản và quyền người dùng',
      icon: Users,
      path: '/admin/users',
      color: 'green',
      stats: stats?.users ? {
        total: stats.users.total,
        active: stats.users.active
      } : null
    },
    {
      title: 'Báo cáo hệ thống',
      description: 'Xem báo cáo chi tiết và thống kê',
      icon: BarChart3,
      path: '/admin/reports',
      color: 'purple',
      disabled: true
    },
    {
      title: 'Cài đặt',
      description: 'Cấu hình hệ thống và tùy chỉnh',
      icon: Settings,
      path: '/admin/settings',
      color: 'gray',
      disabled: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {quickActions.map((action) => {
        const Icon = action.icon;
        const isDisabled = action.disabled;

        return (
          <button
            key={action.path}
            onClick={() => !isDisabled && onNavigate(action.path)}
            disabled={isDisabled}
            className={`
              p-6 bg-white rounded-lg border-2 border-gray-200 text-left transition-all duration-200
              ${isDisabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:border-blue-300 hover:shadow-md transform hover:-translate-y-1'
              }
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`
                w-12 h-12 rounded-lg flex items-center justify-center
                ${action.color === 'blue' ? 'bg-blue-100' : 
                  action.color === 'green' ? 'bg-green-100' : 
                  action.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'}
              `}>
                <Icon className={`w-6 h-6 ${
                  action.color === 'blue' ? 'text-blue-600' : 
                  action.color === 'green' ? 'text-green-600' : 
                  action.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                }`} />
              </div>

              {isDisabled && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                  Coming Soon
                </span>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{action.description}</p>

            {action.stats && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Tổng:</span>
                  <span className="font-medium">{action.stats.total}</span>
                </div>
                {action.stats.pending && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Chờ:</span>
                    <span className="font-medium text-yellow-600">{action.stats.pending}</span>
                  </div>
                )}
                {action.stats.active && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Hoạt động:</span>
                    <span className="font-medium text-green-600">{action.stats.active}</span>
                  </div>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ✅ Enhanced Delete Confirmation Modal with deletion options
const DeleteConfirmModal: React.FC<{
  user: SimpleUser | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSoft: () => Promise<void>;
  onConfirmHard: () => Promise<void>;
  isLoading: boolean;
  deletionInfo?: DeletionInfo;
}> = ({ user, isOpen, onClose, onConfirmSoft, onConfirmHard, isLoading, deletionInfo }) => {
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');
  const [showDeletionInfo, setShowDeletionInfo] = useState(false);

  if (!isOpen || !user) return null;

  const totalContent = (deletionInfo?.related_data?.articles || 0) + (deletionInfo?.related_data?.comments || 0);
  const hasSignificantData = totalContent > 5 || (deletionInfo?.related_data?.appointments || 0) > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            deleteType === 'hard' ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            {deleteType === 'hard' ? (
              <Database className="w-6 h-6 text-red-600" />
            ) : (
              <UserX className="w-6 h-6 text-yellow-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {deleteType === 'hard' ? 'Xóa hoàn toàn người dùng' : 'Vô hiệu hóa người dùng'}
            </h3>
            <p className="text-sm text-gray-500">
              {deleteType === 'hard' ? 'Xóa vĩnh viễn khỏi hệ thống' : 'Tài khoản sẽ bị vô hiệu hóa'}
            </p>
          </div>
        </div>

        {/* Delete Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Chọn loại xóa:</label>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="radio"
                id="soft-delete"
                name="deleteType"
                value="soft"
                checked={deleteType === 'soft'}
                onChange={() => setDeleteType('soft')}
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500"
              />
              <label htmlFor="soft-delete" className="ml-3 flex-1">
                <div className="flex items-center gap-2">
                  <UserX className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-gray-900">Vô hiệu hóa (Soft Delete)</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Tài khoản sẽ bị vô hiệu hóa nhưng dữ liệu được giữ lại. Có thể khôi phục sau.
                </p>
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="radio"
                id="hard-delete"
                name="deleteType"
                value="hard"
                checked={deleteType === 'hard'}
                onChange={() => setDeleteType('hard')}
                className="h-4 w-4 text-red-600 focus:ring-red-500"
                disabled={!deletionInfo?.can_delete}
              />
              <label htmlFor="hard-delete" className="ml-3 flex-1">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-gray-900">Xóa hoàn toàn (Hard Delete)</span>
                  {!deletionInfo?.can_delete && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Không thể xóa</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Xóa vĩnh viễn người dùng và tất cả dữ liệu liên quan. KHÔNG THỂ HOÀN TÁC!
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className={`border rounded-lg p-4 mb-4 ${deleteType === 'hard' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${deleteType === 'hard' ? 'text-red-600' : 'text-yellow-600'}`} />
            <div>
              <p className={`text-sm font-medium mb-2 ${deleteType === 'hard' ? 'text-red-800' : 'text-yellow-800'}`}>
                Thông tin người dùng sẽ bị {deleteType === 'hard' ? 'xóa' : 'vô hiệu hóa'}:
              </p>
              <div className={`text-sm space-y-1 ${deleteType === 'hard' ? 'text-red-700' : 'text-yellow-700'}`}>
                <p><strong>Tên:</strong> {user.full_name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Vai trò:</strong> {user.role_display}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Deletion Info */}
        {deletionInfo && deleteType === 'hard' && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowDeletionInfo(!showDeletionInfo)}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 mb-3"
            >
              <Eye className="w-4 h-4" />
              {showDeletionInfo ? 'Ẩn' : 'Xem'} chi tiết dữ liệu sẽ bị xóa
            </button>

            {showDeletionInfo && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Dữ liệu sẽ bị xóa:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(deletionInfo.related_data).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 capitalize">
                        {key.replace('_', ' ')}:
                      </span>
                      <span className="font-medium text-gray-900">
                        {typeof value === 'boolean' ? (value ? 'Có' : 'Không') : value}
                      </span>
                    </div>
                  ))}
                </div>

                {deletionInfo.warnings.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 mb-1">Cảnh báo:</p>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {deletionInfo.warnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* High Risk Warning for Hard Delete */}
        {deleteType === 'hard' && hasSignificantData && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">⚠️ CẢNH BÁO NGUY HIỂM</p>
                <p className="text-sm text-red-700">
                  Người dùng này có nhiều dữ liệu quan trọng ({totalContent} bài viết/bình luận).
                  Việc xóa sẽ ảnh hưởng đến toàn bộ hệ thống và KHÔNG THỂ HOÀN TÁC!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={deleteType === 'hard' ? onConfirmHard : onConfirmSoft}
            disabled={isLoading || (deleteType === 'hard' && !deletionInfo?.can_delete)}
            className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${
              deleteType === 'hard' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {deleteType === 'hard' ? 'Đang xóa hoàn toàn...' : 'Đang vô hiệu hóa...'}
              </>
            ) : (
              <>
                {deleteType === 'hard' ? (
                  <Database className="w-4 h-4" />
                ) : (
                  <UserX className="w-4 h-4" />
                )}
                {deleteType === 'hard' ? 'Xóa hoàn toàn' : 'Vô hiệu hóa'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ Enhanced User Actions Dropdown with both delete options
const UserActionsDropdown: React.FC<{
  user: SimpleUser;
  onStatusChange: (userId: number, isActive: boolean) => Promise<void>;
  onDelete: (user: SimpleUser, type: 'soft' | 'hard') => void;
  currentUserId?: number;
}> = ({ user, onStatusChange, onDelete, currentUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(false);

  const isSelf = currentUserId === user.user_id;

  const handleStatusToggle = async () => {
    setIsStatusLoading(true);
    try {
      await onStatusChange(user.user_id, !user.is_active);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert('Failed to update user status: ' + (error as Error).message);
    } finally {
      setIsStatusLoading(false);
    }
  };

  const handleSoftDelete = () => {
    onDelete(user, 'soft');
    setIsOpen(false);
  };

  const handleHardDelete = () => {
    onDelete(user, 'hard');
    setIsOpen(false);
  };

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

          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[200px] py-1">
            {/* Status Toggle Button */}
            <button
              onClick={handleStatusToggle}
              disabled={isStatusLoading || isSelf}
              className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-colors ${
                user.is_active 
                  ? 'text-yellow-600 hover:bg-yellow-50' 
                  : 'text-green-600 hover:bg-green-50'
              }`}
            >
              {isStatusLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : user.is_active ? (
                <UserX className="w-4 h-4" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              <span>
                {user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                {isSelf && ' (Bản thân)'}
              </span>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-100 my-1"></div>

            {/* Soft Delete Button */}
            <button
              onClick={handleSoftDelete}
              disabled={isSelf}
              className="w-full px-4 py-3 text-left text-sm text-yellow-600 hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-colors"
              title={isSelf ? 'Không thể vô hiệu hóa tài khoản của chính mình' : 'Vô hiệu hóa người dùng'}
            >
              <UserX className="w-4 h-4" />
              <span>
                Vô hiệu hóa
                {isSelf && ' (Không thể)'}
              </span>
            </button>

            {/* Hard Delete Button */}
            <button
              onClick={handleHardDelete}
              disabled={isSelf}
              className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-colors"
              title={isSelf ? 'Không thể xóa tài khoản của chính mình' : 'Xóa hoàn toàn người dùng'}
            >
              <Database className="w-4 h-4" />
              <span>
                Xóa hoàn toàn
                {isSelf && ' (Không thể)'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ✅ Role Badge Component
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const getRoleStyle = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'doctor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'parent':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleStyle(role)}`}>
      {role}
    </span>
  );
};

// ✅ Status Badge Component
const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
      isActive 
        ? 'bg-green-100 text-green-800 border-green-200' 
        : 'bg-red-100 text-red-800 border-red-200'
    }`}>
      {isActive ? (
        <>
          <UserCheck className="w-3 h-3 mr-1" />
          Active
        </>
      ) : (
        <>
          <UserX className="w-3 h-3 mr-1" />
          Inactive
        </>
      )}
    </span>
  );
};

// ✅ Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  change?: number;
  changeType?: 'increase' | 'decrease';
}> = ({ title, value, icon: Icon, change, changeType }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        {change && (
          <p className={`text-sm ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
            {changeType === 'increase' ? '+' : '-'}{change}% từ tháng trước
          </p>
        )}
      </div>
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
    </div>
  </div>
);

// ✅ User Row Component
const UserRow: React.FC<{
  user: SimpleUser;
  onStatusChange: (userId: number, isActive: boolean) => Promise<void>;
  onDelete: (user: SimpleUser, type: 'soft' | 'hard') => void;
  currentUserId?: number;
}> = ({ user, onStatusChange, onDelete, currentUserId }) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentNode as HTMLElement;
                  const fallback = parent.querySelector('.fallback-icon') as HTMLElement;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
            ) : null}
            <User className={`w-5 h-5 text-gray-500 fallback-icon ${user.avatar_url ? 'hidden' : ''}`} />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
            <div className="text-sm text-gray-500">@{user.username}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{user.email}</div>
        {user.phone && <div className="text-sm text-gray-500">{user.phone}</div>}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <RoleBadge role={user.role_display} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge isActive={user.is_active} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(user.created_at).toLocaleDateString('vi-VN')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.last_activity
          ? new Date(user.last_activity).toLocaleDateString('vi-VN')
          : 'Chưa có'
        }
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
        <UserActionsDropdown
          user={user}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          currentUserId={currentUserId}
        />
      </td>
    </tr>
  );
};

// ✅ MAIN COMPONENT - Enhanced Admin Dashboard with Navigation
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [stats, setStats] = useState<SimpleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'overview' | 'users'>('overview');

  // ... (rest of the existing state remains the same)
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
    has_more: false
  });

  // Enhanced delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user: SimpleUser | null;
    isLoading: boolean;
    deleteType: 'soft' | 'hard';
    deletionInfo?: DeletionInfo;
  }>({
    isOpen: false,
    user: null,
    isLoading: false,
    deleteType: 'soft'
  });

  // Current user state
  const [currentUserId, setCurrentUserId] = useState<number | undefined>();

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Navigation handler
  const handleNavigation = (path: string) => {
    if (path === '/admin' || path === '/admin/users') {
      setCurrentView(path === '/admin' ? 'overview' : 'users');
      setSidebarOpen(false);
    } else {
      navigate(path);
    }
  };

  // ... (rest of the existing useEffect hooks and functions remain the same)
  // Get current user ID from token
  useEffect(() => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const userId = parseInt(payload.sub || payload.identity || '0');
          if (userId > 0) {
            setCurrentUserId(userId);
          }
        }
      }
    } catch (error) {
      console.warn('Could not extract user ID from token:', error);
    }
  }, []);

  // Load users
  const loadUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {
        page: page.toString(),
        limit: pagination.per_page.toString(),
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) {
          delete params[key];
        }
      });

      console.log('🔍 Loading users with params:', params);

      const response = await adminService.getUsers(params);
      setUsers(response.data);
      setPagination(response.pagination);

      console.log('✅ Users loaded:', response.data.length);
    } catch (err) {
      console.error('❌ Error loading users:', err);
      const errorMessage = (err as Error).message || 'Failed to load users';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      console.log('📊 Loading admin stats...');
      const response = await adminService.getStats();
      setStats(response.data);
      console.log('✅ Stats loaded:', response.data);
    } catch (err) {
      console.error('❌ Failed to load stats:', err);
    }
  };

  // Initial load
  useEffect(() => {
    console.log('🚀 AdminDashboard mounted, loading data...');
    loadUsers();
    loadStats();
  }, []);

  // Reload when filters change
  useEffect(() => {
    console.log('🔄 Filters changed, reloading users...', filters);
    const timeoutId = setTimeout(() => {
      loadUsers(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Handle status change
  const handleStatusChange = async (userId: number, isActive: boolean) => {
    try {
      await adminService.updateUserStatus(userId, isActive);
      setUsers(users.map(user =>
        user.user_id === userId
          ? { ...user, is_active: isActive, status_display: isActive ? 'Active' : 'Inactive' }
          : user
      ));
      loadStats();
    } catch (err) {
      throw err;
    }
  };

  // Handle delete user (enhanced with type selection and deletion info)
  const handleDeleteUser = async (user: SimpleUser, type: 'soft' | 'hard') => {
    try {
      // Get deletion info for hard delete
      let deletionInfo: DeletionInfo | undefined;
      if (type === 'hard') {
        try {
          const infoResponse = await adminService.getDeletionInfo(user.user_id);
          deletionInfo = infoResponse.data;
        } catch (error) {
          console.error('Failed to get deletion info:', error);
          // Continue without deletion info
        }
      }

      setDeleteModal({
        isOpen: true,
        user,
        isLoading: false,
        deleteType: type,
        deletionInfo
      });
    } catch (error) {
      console.error('Error preparing delete modal:', error);
      alert('Không thể chuẩn bị thông tin xóa: ' + (error as Error).message);
    }
  };

  // Confirm soft delete
  const handleConfirmSoftDelete = async () => {
    if (!deleteModal.user) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      await adminService.deleteUser(deleteModal.user.user_id);

      setUsers(users.map(user =>
        user.user_id === deleteModal.user!.user_id
          ? { ...user, is_active: false, status_display: 'Inactive' }
          : user
      ));

      setDeleteModal({ isOpen: false, user: null, isLoading: false, deleteType: 'soft' });
      loadStats();
      alert('Người dùng đã được vô hiệu hóa thành công!');
    } catch (error) {
      console.error('Failed to soft delete user:', error);
      alert('Lỗi khi vô hiệu hóa người dùng: ' + (error as Error).message);
    } finally {
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Confirm hard delete
  const handleConfirmHardDelete = async () => {
    if (!deleteModal.user) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      await adminService.hardDeleteUser(deleteModal.user.user_id);

      // Remove user from list completely
      setUsers(users.filter(user => user.user_id !== deleteModal.user!.user_id));

      setDeleteModal({ isOpen: false, user: null, isLoading: false, deleteType: 'hard' });
      loadStats();
      alert('Người dùng đã được xóa hoàn toàn khỏi hệ thống!');
    } catch (error) {
      console.error('Failed to hard delete user:', error);
      alert('Lỗi khi xóa hoàn toàn người dùng: ' + (error as Error).message);
    } finally {
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Close delete modal
  const handleCloseDeleteModal = () => {
    if (!deleteModal.isLoading) {
      setDeleteModal({ isOpen: false, user: null, isLoading: false, deleteType: 'soft' });
    }
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Refresh data
  const handleRefresh = () => {
    loadUsers();
    loadStats();
  };

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không thể truy cập</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <button
              onClick={() => {
                setError(null);
                loadUsers();
                loadStats();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Thử lại
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        currentPage={currentView === 'overview' ? '/admin' : '/admin/users'}
        onNavigate={handleNavigation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          {currentView === 'overview' ? (
            // Overview Page
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                      <BarChart3 className="w-8 h-8 text-blue-600" />
                      Admin Dashboard
                    </h1>
                    <p className="text-gray-600 mt-2">Tổng quan và quản lý hệ thống</p>
                  </div>
                  <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Làm mới dữ liệu"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Làm mới
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatsCard
                    title="Tổng người dùng"
                    value={stats.users.total}
                    icon={Users}
                    change={12}
                    changeType="increase"
                  />
                  <StatsCard
                    title="Người dùng hoạt động"
                    value={stats.users.active}
                    icon={UserCheck}
                    change={8}
                    changeType="increase"
                  />
                  <StatsCard
                    title="Bác sĩ"
                    value={stats.users_by_role.doctors}
                    icon={Activity}
                    change={5}
                    changeType="increase"
                  />
                  <StatsCard
                    title="Bài viết"
                    value={stats.content.total_articles}
                    icon={FileText}
                    change={15}
                    changeType="increase"
                  />
                </div>
              )}

              {/* Quick Actions */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Truy cập nhanh</h2>
                <QuickActionCards onNavigate={handleNavigation} stats={stats} />
              </div>

              {/* Recent Activity or Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Có {stats?.content.total_articles || 0} bài viết cần duyệt</p>
                      <p className="text-xs text-gray-500">Truy cập quản lý bài viết để xem chi tiết</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Users className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{stats?.users.active || 0} người dùng đang hoạt động</p>
                      <p className="text-xs text-gray-500">Tăng {stats?.users.recent_signups || 0} người dùng mới tuần này</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Users Management Page
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                      <Users className="w-8 h-8 text-blue-600" />
                      Quản lý người dùng
                    </h1>
                    <p className="text-gray-600 mt-2">Quản lý tài khoản và quyền người dùng</p>
                  </div>
                  <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Làm mới dữ liệu"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Làm mới
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatsCard
                    title="Tổng người dùng"
                    value={stats.users.total}
                    icon={Users}
                    change={12}
                    changeType="increase"
                  />
                  <StatsCard
                    title="Người dùng hoạt động"
                    value={stats.users.active}
                    icon={UserCheck}
                    change={8}
                    changeType="increase"
                  />
                  <StatsCard
                    title="Bác sĩ"
                    value={stats.users_by_role.doctors}
                    icon={Activity}
                    change={5}
                    changeType="increase"
                  />
                  <StatsCard
                    title="Bài viết"
                    value={stats.content.total_articles}
                    icon={Eye}
                    change={15}
                    changeType="increase"
                  />
                </div>
              )}

              {/* Users Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 relative">
                {/* Table Header with Filters */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Danh sách người dùng
                      <span className="text-sm text-gray-500">({pagination.total})</span>
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Tìm kiếm người dùng..."
                          value={filters.search}
                          onChange={(e) => handleFilterChange('search', e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                        />
                      </div>

                      {/* Role Filter */}
                      <select
                        value={filters.role}
                        onChange={(e) => handleFilterChange('role', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Tất cả vai trò</option>
                        <option value="admin">Admin</option>
                        <option value="doctor">Bác sĩ</option>
                        <option value="parent">Phụ huynh</option>
                      </select>

                      {/* Status Filter */}
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto relative">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Người dùng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Liên hệ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vai trò
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ngày tạo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hoạt động cuối
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 relative">
                      {loading ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i}>
                            <td colSpan={7} className="px-6 py-4">
                              <div className="animate-pulse flex space-x-4">
                                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                                <div className="flex-1 space-y-2 py-1">
                                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                              <Users className="w-12 h-12 text-gray-300 mb-4" />
                              <p className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy người dùng nào</p>
                              <p className="text-gray-500">
                                {filters.search || filters.role || filters.status
                                  ? 'Thử thay đổi bộ lọc để xem kết quả khác'
                                  : 'Hệ thống chưa có người dùng nào'
                                }
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <UserRow
                            key={user.user_id}
                            user={user}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDeleteUser}
                            currentUserId={currentUserId}
                          />
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
                      {Math.min(pagination.current_page * pagination.per_page, pagination.total)} trong số {pagination.total} kết quả
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => loadUsers(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white"
                      >
                        Trước
                      </button>
                      <span className="px-3 py-1 text-sm bg-white border border-gray-300 rounded">
                        Trang {pagination.current_page} / {pagination.total_pages}
                      </span>
                      <button
                        onClick={() => loadUsers(pagination.current_page + 1)}
                        disabled={!pagination.has_more}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors bg-white"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Security Notice */}
              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">Lưu ý bảo mật và xóa dữ liệu</h4>
                    <div className="text-sm text-yellow-700 space-y-1">
                      <p>• <strong>Vô hiệu hóa (Soft Delete):</strong> Tài khoản bị vô hiệu hóa nhưng dữ liệu được giữ lại, có thể khôi phục</p>
                      <p>• <strong>Xóa hoàn toàn (Hard Delete):</strong> Xóa vĩnh viễn người dùng và TẤT CẢ dữ liệu liên quan - KHÔNG THỂ HOÀN TÁC!</p>
                      <p>• Không thể xóa tài khoản của chính mình</p>
                      <p>• Tất cả thao tác đều được ghi log và có thể kiểm tra</p>
                      <p>• <strong>Cảnh báo:</strong> Hard Delete sẽ xóa articles, comments, appointments, follows, likes, saves và tất cả dữ liệu liên quan</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Enhanced Delete Confirmation Modal */}
      <DeleteConfirmModal
        user={deleteModal.user}
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirmSoft={handleConfirmSoftDelete}
        onConfirmHard={handleConfirmHardDelete}
        isLoading={deleteModal.isLoading}
        deletionInfo={deleteModal.deletionInfo}
      />
    </div>
  );
};

export default AdminDashboard;