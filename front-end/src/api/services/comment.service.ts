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

      const response = await apiClient.get<{
        success: boolean;
        data: Comment[];
      }>(`${API_ENDPOINTS.COMMENTS.LIST}?content_id=${contentId}`);

      if (!response.data.success) {
        throw new Error('Failed to fetch comments');
      }

      // Organize comments into parent-child structure
      const comments = response.data.data;
      const parentComments = comments.filter(c => !c.parent_comment_id);
      const replies = comments.filter(c => c.parent_comment_id);

      // Attach replies to parent comments
      parentComments.forEach(parent => {
        parent.replies = replies.filter(reply => reply.parent_comment_id === parent.comment_id);
      });

      return parentComments;
    } catch (error: any) {
      console.error('❌ Error fetching comments:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch comments');
    }
  }

  /**
   * Add new comment
   */
  async addComment(commentData: CreateCommentRequest): Promise<Comment> {
    try {
      console.log('📡 Adding comment:', commentData);

      if (!commentData.comment_text.trim()) {
        throw new Error('Nội dung bình luận không được để trống');
      }

      const response = await apiClient.post<{
        success: boolean;
        data: Comment;
      }>(API_ENDPOINTS.COMMENTS.CREATE, commentData);

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to add comment');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error adding comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to add comment');
    }
  }

  /**
   * Update comment
   */
  async updateComment(commentId: number, commentText: string): Promise<Comment> {
    try {
      console.log('📡 Updating comment:', commentId);

      const response = await apiClient.put<{
        success: boolean;
        data: Comment;
      }>(`${API_ENDPOINTS.COMMENTS.UPDATE(commentId)}`, {
        comment_text: commentText
      });

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to update comment');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error updating comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to update comment');
    }
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: number): Promise<void> {
    try {
      console.log('📡 Deleting comment:', commentId);

      await apiClient.delete(API_ENDPOINTS.COMMENTS.DELETE(commentId));
    } catch (error: any) {
      console.error('❌ Error deleting comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete comment');
    }
  }

  /**
   * Like/Unlike comment
   */
  async toggleCommentLike(commentId: number): Promise<{ liked: boolean; like_count: number }> {
    try {
      console.log('📡 Toggling comment like:', commentId);

      const response = await apiClient.post<{
        success: boolean;
        data: {
          liked: boolean;
          like_count: number;
        };
      }>(`${API_ENDPOINTS.COMMENTS.LIKE(commentId)}`);

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to toggle comment like');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error toggling comment like:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle comment like');
    }
  }

  /**
   * Get user's comments
   */
  async getUserComments(userId?: number): Promise<Comment[]> {
    try {
      console.log('📡 Fetching user comments:', userId);

      const endpoint = userId
        ? `${API_ENDPOINTS.COMMENTS.USER_COMMENTS}?user_id=${userId}`
        : API_ENDPOINTS.COMMENTS.MY_COMMENTS;

      const response = await apiClient.get<{
        success: boolean;
        data: Comment[];
      }>(endpoint);

      if (!response.data.success) {
        throw new Error('Failed to fetch user comments');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error fetching user comments:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user comments');
    }
  }

  /**
   * Report comment
   */
  async reportComment(commentId: number, reason: string): Promise<void> {
    try {
      console.log('📡 Reporting comment:', commentId, reason);

      await apiClient.post(API_ENDPOINTS.COMMENTS.REPORT(commentId), {
        reason
      });
    } catch (error: any) {
      console.error('❌ Error reporting comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to report comment');
    }
  }
}

export const commentService = new CommentService();