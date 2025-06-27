import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";

export interface Comment {
  comment_id: number;
  content_id: number;
  user_id: number;
  parent_comment_id?: number;
  comment_text: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  is_approved: boolean;
  user: {
    user_id: number;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

export interface CreateCommentRequest {
  content_id: number;
  comment_text: string;
  parent_comment_id?: number;
}

export interface CommentFilters {
  content_id?: number;
  user_id?: number;
  parent_comment_id?: number;
  is_approved?: boolean;
  limit?: number;
  page?: number;
}

class CommentService {
  /**
   * Get comments for an article/content
   */
  async getArticleComments(contentId: number): Promise<Comment[]> {
    try {
      console.log('📡 Fetching comments for content:', contentId);

      // ✅ FIX: Sử dụng endpoint đúng từ API_ENDPOINTS
      const response = await apiClient.get<{
        success: boolean;
        data: Comment[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          total_pages: number;
          has_more: boolean;
        };
      }>(`${API_ENDPOINTS.COMMENTS.LIST}?content_id=${contentId}`);

      console.log('📥 Comments response:', {
        success: response.data.success,
        commentsCount: response.data.data?.length || 0
      });

      if (!response.data.success) {
        throw new Error('Failed to fetch comments');
      }

      // Return comments with replies already organized
      return response.data.data || [];

    } catch (error: any) {
      console.error('❌ Error fetching comments:', error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please log in to view comments');
      } else if (error.response?.status === 404) {
        throw new Error('Comments not found');
      } else if (error.response?.status === 500) {
        throw new Error('Server error: Failed to fetch comments');
      } else if (!error.response) {
        throw new Error('Network error: Unable to connect to server');
      }

      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch comments');
    }
  }

  /**
   * Add new comment
   */
  async addComment(commentData: CreateCommentRequest): Promise<Comment> {
    try {
      console.log('📡 Adding comment:', {
        content_id: commentData.content_id,
        text_length: commentData.comment_text.length,
        is_reply: !!commentData.parent_comment_id
      });

      // Validation
      if (!commentData.comment_text.trim()) {
        throw new Error('Nội dung bình luận không được để trống');
      }

      if (commentData.comment_text.length > 1000) {
        throw new Error('Bình luận không được vượt quá 1000 ký tự');
      }

      const response = await apiClient.post<{
        success: boolean;
        data: Comment;
        message?: string;
      }>(API_ENDPOINTS.COMMENTS.CREATE, {
        content_id: commentData.content_id,
        comment_text: commentData.comment_text.trim(),
        parent_comment_id: commentData.parent_comment_id
      });

      console.log('📥 Add comment response:', {
        success: response.data.success,
        comment_id: response.data.data?.comment_id
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to add comment');
      }

      return response.data.data;

    } catch (error: any) {
      console.error('❌ Error adding comment:', error);

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please log in to comment');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.error || 'Invalid comment data');
      } else if (error.response?.status === 404) {
        throw new Error('Article not found');
      } else if (error.response?.status === 422) {
        throw new Error('Invalid user identity');
      }

      throw new Error(error.response?.data?.error || error.message || 'Failed to add comment');
    }
  }

  /**
   * Update comment
   */
  async updateComment(commentId: number, commentText: string): Promise<Comment> {
    try {
      console.log('📡 Updating comment:', commentId);

      if (!commentText.trim()) {
        throw new Error('Nội dung bình luận không được để trống');
      }

      if (commentText.length > 1000) {
        throw new Error('Bình luận không được vượt quá 1000 ký tự');
      }

      const response = await apiClient.put<{
        success: boolean;
        data: Comment;
        message?: string;
      }>(API_ENDPOINTS.COMMENTS.UPDATE(commentId), {
        comment_text: commentText.trim()
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to update comment');
      }

      return response.data.data;

    } catch (error: any) {
      console.error('❌ Error updating comment:', error);

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please log in');
      } else if (error.response?.status === 403) {
        throw new Error('Forbidden: You can only edit your own comments');
      } else if (error.response?.status === 404) {
        throw new Error('Comment not found');
      }

      throw new Error(error.response?.data?.error || error.message || 'Failed to update comment');
    }
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: number): Promise<void> {
    try {
      console.log('📡 Deleting comment:', commentId);

      const response = await apiClient.delete<{
        success: boolean;
        message?: string;
      }>(API_ENDPOINTS.COMMENTS.DELETE(commentId));

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete comment');
      }

    } catch (error: any) {
      console.error('❌ Error deleting comment:', error);

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please log in');
      } else if (error.response?.status === 403) {
        throw new Error('Forbidden: You can only delete your own comments');
      } else if (error.response?.status === 404) {
        throw new Error('Comment not found');
      }

      throw new Error(error.response?.data?.error || error.message || 'Failed to delete comment');
    }
  }

  /**
   * Like/Unlike comment
   */
  async toggleCommentLike(commentId: number, action: 'like' | 'unlike' | 'toggle' = 'toggle'): Promise<{ liked: boolean; like_count: number }> {
    try {
      console.log('📡 Toggling comment like:', commentId, action);

      const response = await apiClient.post<{
        success: boolean;
        data: {
          liked: boolean;
          like_count: number;
        };
      }>(API_ENDPOINTS.COMMENTS.LIKE(commentId), {
        action
      });

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to toggle comment like');
      }

      return response.data.data;

    } catch (error: any) {
      console.error('❌ Error toggling comment like:', error);

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please log in to like comments');
      } else if (error.response?.status === 404) {
        throw new Error('Comment not found');
      }

      throw new Error(error.response?.data?.error || error.message || 'Failed to toggle comment like');
    }
  }

  /**
   * Get user's comments
   */
  async getUserComments(userId?: number): Promise<Comment[]> {
    try {
      console.log('📡 Fetching user comments:', userId);

      const response = await apiClient.get<{
        success: boolean;
        data: Comment[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          total_pages: number;
        };
      }>(API_ENDPOINTS.COMMENTS.MY_COMMENTS);

      if (!response.data.success) {
        throw new Error('Failed to fetch user comments');
      }

      return response.data.data || [];

    } catch (error: any) {
      console.error('❌ Error fetching user comments:', error);

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please log in');
      }

      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch user comments');
    }
  }

  /**
   * Report comment
   */
  async reportComment(commentId: number, reason: string): Promise<void> {
    try {
      console.log('📡 Reporting comment:', commentId, reason);

      if (!reason.trim()) {
        throw new Error('Lý do báo cáo không được để trống');
      }

      const response = await apiClient.post<{
        success: boolean;
        message?: string;
      }>(API_ENDPOINTS.COMMENTS.REPORT(commentId), {
        reason: reason.trim()
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to report comment');
      }

    } catch (error: any) {
      console.error('❌ Error reporting comment:', error);

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please log in to report comments');
      } else if (error.response?.status === 404) {
        throw new Error('Comment not found');
      }

      throw new Error(error.response?.data?.error || error.message || 'Failed to report comment');
    }
  }

  /**
   * Health check for comments service
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log('🔍 Checking comments service health...');

      const response = await apiClient.get<{
        success: boolean;
        service: string;
        status: string;
      }>(API_ENDPOINTS.COMMENTS.HEALTH);

      const isHealthy = response.data.success && response.data.status === 'healthy';

      console.log('✅ Comments service health:', isHealthy ? 'healthy' : 'unhealthy');

      return isHealthy;

    } catch (error: any) {
      console.error('❌ Comments service health check failed:', error);
      return false;
    }
  }

  /**
   * Get comments with pagination
   */
  async getCommentsPaginated(
    contentId: number,
    options: {
      page?: number;
      limit?: number;
      includeReplies?: boolean;
    } = {}
  ): Promise<{
    comments: Comment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_more: boolean;
    };
  }> {
    try {
      const { page = 1, limit = 20, includeReplies = true } = options;

      console.log('📡 Fetching paginated comments:', {
        contentId,
        page,
        limit,
        includeReplies
      });

      const response = await apiClient.get<{
        success: boolean;
        data: Comment[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          total_pages: number;
          has_more: boolean;
        };
      }>(`${API_ENDPOINTS.COMMENTS.LIST}?content_id=${contentId}&page=${page}&limit=${limit}`);

      if (!response.data.success) {
        throw new Error('Failed to fetch comments');
      }

      return {
        comments: response.data.data || [],
        pagination: response.data.pagination || {
          page,
          limit,
          total: 0,
          total_pages: 0,
          has_more: false
        }
      };

    } catch (error: any) {
      console.error('❌ Error fetching paginated comments:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch comments');
    }
  }
}

export const commentService = new CommentService();