// src/services/admin.service.ts - Enhanced with Hard Delete - FIXED
import apiClient from '../client';

// ✅ All existing interfaces remain the same...
export interface UserData {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  user_type: number;
  role_id: number;
  role_info?: {
    role_id: number;
    role_name: string;
    description: string;
  };
  profile?: {
    type: string;
    [key: string]: any;
  };
  role_display: string;
  status_display: string;
  last_activity?: string;
}

export interface UsersResponse {
  success: boolean;
  data: UserData[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
  filters: {
    search: string;
    role: string;
    status: string;
    sort_by: string;
    sort_order: string;
  };
  summary: {
    total_users: number;
    filtered_users: number;
  };
}

export interface AdminStats {
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
  activity: {
    new_users_last_30_days: number;
  };
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface StatusUpdateResponse {
  success: boolean;
  message: string;
  data?: {
    user_id: number;
    old_status: boolean;
    new_status: boolean;
  };
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
  data?: {
    user_id: number;
    username: string;
    status: string;
  };
}

export interface HardDeleteUserResponse {
  success: boolean;
  message: string;
  data?: {
    deleted_user: {
      user_id: number;
      username: string;
      email: string;
      full_name: string;
      role_id: number;
    };
    deletion_type: string;
    deleted_at: string;
  };
}

export interface DeletionInfo {
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

export interface DeletionInfoResponse {
  success: boolean;
  data: DeletionInfo;
}

export interface StatsResponse {
  success: boolean;
  data: AdminStats;
  generated_at: string;
}

export interface UserDetailResponse {
  success: boolean;
  data: UserData;
}

export interface HealthResponse {
  success: boolean;
  service: string;
  status: string;
  database?: string;
  total_users?: number;
  endpoints?: Record<string, string>;
}

class AdminService {
  // ✅ Get all users with filters and pagination
  async getUsers(filters: UserFilters = {}): Promise<UsersResponse> {
    console.log('📡 Admin: Fetching users with filters:', filters);

    try {
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.sort_order) params.append('sort_order', filters.sort_order);

      const response = await apiClient.get(`/admin/users?${params.toString()}`);

      console.log('✅ Admin: Users fetched successfully', response.data);
      return response.data as UsersResponse;
    } catch (error: any) {
      console.error('❌ Admin: Error fetching users:', error);

      if (error.response?.status === 403) {
        throw new Error('Không có quyền truy cập. Chỉ Admin mới có thể xem danh sách người dùng.');
      } else if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (error.response?.status === 422) {
        throw new Error('Token không hợp lệ. Vui lòng đăng nhập lại.');
      }

      throw new Error(error.response?.data?.error || 'Không thể tải danh sách người dùng');
    }
  }

  async getUserDetail(userId: number): Promise<UserDetailResponse> {
    console.log(`📡 Admin: Fetching user detail for ID: ${userId}`);

    try {
      const response = await apiClient.get(`/admin/users/${userId}`);

      console.log('✅ Admin: User detail fetched successfully', response.data);
      return response.data as UserDetailResponse;
    } catch (error: any) {
      console.error('❌ Admin: Error fetching user detail:', error);
      throw new Error(error.response?.data?.error || 'Không thể tải thông tin người dùng');
    }
  }

  async updateUserStatus(userId: number, isActive: boolean): Promise<StatusUpdateResponse> {
    console.log(`📡 Admin: Updating user ${userId} status to ${isActive ? 'active' : 'inactive'}`);

    try {
      const response = await apiClient.put(`/admin/users/${userId}/status`, {
        is_active: isActive
      });

      console.log('✅ Admin: User status updated successfully', response.data);
      return response.data as StatusUpdateResponse;
    } catch (error: any) {
      console.error('❌ Admin: Error updating user status:', error);

      if (error.response?.status === 403) {
        if (error.response?.data?.error_code === 'SELF_MODIFICATION_DENIED') {
          throw new Error('Không thể thay đổi trạng thái tài khoản của chính mình');
        }
        throw new Error('Không có quyền thực hiện thao tác này');
      }

      throw new Error(error.response?.data?.error || 'Không thể cập nhật trạng thái người dùng');
    }
  }

  async deleteUser(userId: number): Promise<DeleteUserResponse> {
    console.log(`📡 Admin: Soft deleting user ${userId}`);

    try {
      const response = await apiClient.delete(`/admin/users/${userId}`);

      console.log('✅ Admin: User soft deleted successfully', response.data);
      return response.data as DeleteUserResponse;
    } catch (error: any) {
      console.error('❌ Admin: Error soft deleting user:', error);

      if (error.response?.status === 403) {
        if (error.response?.data?.error_code === 'SELF_DELETION_DENIED') {
          throw new Error('Không thể xóa tài khoản của chính mình');
        }
        throw new Error('Không có quyền thực hiện thao tác này');
      } else if (error.response?.status === 404) {
        throw new Error('Không tìm thấy người dùng cần xóa');
      }

      throw new Error(error.response?.data?.error || 'Không thể xóa người dùng');
    }
  }

  async hardDeleteUser(userId: number): Promise<HardDeleteUserResponse> {
    console.log(`📡 Admin: Hard deleting user ${userId}`);

    try {
      const response = await apiClient.delete(`/admin/users/${userId}/hard-delete`);

      console.log('✅ Admin: User hard deleted successfully', response.data);
      return response.data as HardDeleteUserResponse;
    } catch (error: any) {
      console.error('❌ Admin: Error hard deleting user:', error);

      if (error.response?.status === 403) {
        if (error.response?.data?.error_code === 'SELF_DELETION_DENIED') {
          throw new Error('Không thể xóa tài khoản của chính mình');
        }
        throw new Error('Không có quyền thực hiện thao tác này');
      } else if (error.response?.status === 404) {
        throw new Error('Không tìm thấy người dùng cần xóa');
      } else if (error.response?.status === 409) {
        throw new Error('Không thể xóa người dùng do ràng buộc dữ liệu. ' + (error.response?.data?.error || ''));
      }

      throw new Error(error.response?.data?.error || 'Không thể xóa hoàn toàn người dùng');
    }
  }

  // ✅ FIXED: Method name to match component usage
  async getDeletionInfo(userId: number): Promise<DeletionInfoResponse> {
    console.log(`📡 Admin: Getting deletion info for user ${userId}`);

    try {
      const response = await apiClient.get(`/admin/users/${userId}/deletion-info`);

      console.log('✅ Admin: Deletion info fetched successfully', response.data);
      return response.data as DeletionInfoResponse;
    } catch (error: any) {
      console.error('❌ Admin: Error fetching deletion info:', error);

      if (error.response?.status === 403) {
        throw new Error('Không có quyền truy cập thông tin này');
      } else if (error.response?.status === 404) {
        throw new Error('Không tìm thấy người dùng');
      }

      throw new Error(error.response?.data?.error || 'Không thể tải thông tin xóa người dùng');
    }
  }

  async getStats(): Promise<StatsResponse> {
    console.log('📡 Admin: Fetching dashboard statistics');

    try {
      const response = await apiClient.get('/admin/stats');

      console.log('✅ Admin: Stats fetched successfully', response.data);
      return response.data as StatsResponse;
    } catch (error: any) {
      console.error('❌ Admin: Error fetching stats:', error);
      throw new Error(error.response?.data?.error || 'Không thể tải thống kê');
    }
  }

  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await apiClient.get('/admin/health');
      return response.data as HealthResponse;
    } catch (error: any) {
      console.error('❌ Admin: Health check failed:', error);
      throw new Error('Admin service không khả dụng');
    }
  }

  async validateAdminAccess(): Promise<boolean> {
    try {
      await this.checkHealth();
      return true;
    } catch (error) {
      return false;
    }
  }

  async batchUpdateUserStatus(userIds: number[], isActive: boolean): Promise<{ success: number; failed: number; errors: string[] }> {
    console.log(`📡 Admin: Batch updating ${userIds.length} users status to ${isActive ? 'active' : 'inactive'}`);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const userId of userIds) {
      try {
        await this.updateUserStatus(userId, isActive);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`User ${userId}: ${(error as Error).message}`);
      }
    }

    console.log('✅ Admin: Batch operation completed', results);
    return results;
  }

  async batchHardDeleteUsers(userIds: number[]): Promise<{ success: number; failed: number; errors: string[] }> {
    console.log(`📡 Admin: Batch hard deleting ${userIds.length} users`);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const userId of userIds) {
      try {
        await this.hardDeleteUser(userId);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`User ${userId}: ${(error as Error).message}`);
      }
    }

    console.log('✅ Admin: Batch hard delete completed', results);
    return results;
  }

  async exportUsers(filters: UserFilters = {}): Promise<Blob> {
    console.log('📡 Admin: Exporting users data with filters:', filters);

    try {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.sort_order) params.append('sort_order', filters.sort_order);

      params.append('export', 'true');
      params.append('format', 'csv');

      const response = await apiClient.get(`/admin/users/export?${params.toString()}`, {
        responseType: 'blob'
      });

      console.log('✅ Admin: Users data exported successfully');
      return response.data as Blob;
    } catch (error: any) {
      console.error('❌ Admin: Error exporting users:', error);
      throw new Error(error.response?.data?.error || 'Không thể xuất dữ liệu người dùng');
    }
  }

  getCurrentUserIdFromToken(): number | null {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;

      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      const userId = parseInt(payload.sub || payload.identity || '0');

      return userId > 0 ? userId : null;
    } catch (error) {
      console.warn('Could not extract user ID from token:', error);
      return null;
    }
  }

  canDeleteUser(userId: number): boolean {
    const currentUserId = this.getCurrentUserIdFromToken();
    return currentUserId !== userId;
  }

  canHardDeleteUser(userId: number): boolean {
    const currentUserId = this.getCurrentUserIdFromToken();
    return currentUserId !== userId;
  }

  getUserActionPermissions(userId: number): {
    canEdit: boolean;
    canDelete: boolean;
    canHardDelete: boolean;
    canActivate: boolean;
    canDeactivate: boolean;
  } {
    const currentUserId = this.getCurrentUserIdFromToken();
    const isSelf = currentUserId === userId;

    return {
      canEdit: true,
      canDelete: !isSelf,
      canHardDelete: !isSelf,
      canActivate: !isSelf,
      canDeactivate: !isSelf,
    };
  }

  calculateDeletionImpact(deletionInfo: DeletionInfo): { score: number; level: 'low' | 'medium' | 'high'; description: string } {
    let score = 0;
    const data = deletionInfo.related_data;

    score += (data.articles || 0) * 10;
    score += (data.comments || 0) * 2;
    score += (data.appointments || 0) * 5;
    score += (data.followers || 0) * 1;
    score += (data.likes || 0) * 0.5;
    score += (data.saves || 0) * 1;

    let level: 'low' | 'medium' | 'high';
    let description: string;

    if (score < 10) {
      level = 'low';
      description = 'Tác động thấp - Ít dữ liệu liên quan sẽ bị xóa';
    } else if (score < 50) {
      level = 'medium';
      description = 'Tác động trung bình - Một lượng dữ liệu đáng kể sẽ bị xóa';
    } else {
      level = 'high';
      description = 'Tác động cao - Rất nhiều dữ liệu quan trọng sẽ bị xóa';
    }

    return { score, level, description };
  }
}

// Export singleton instance
export const adminService = new AdminService();
export default adminService;