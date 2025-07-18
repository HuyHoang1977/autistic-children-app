import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import {
  MessageCircle,
  Heart,
  Reply,
  MoreVertical,
  Send,
  Loader2,
  Edit3,
  Trash2,
  Flag,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { commentService } from "../../../api/services/comment.service";
import { useAuth } from "../../../hooks/auth/useAuth";
import { toast } from "sonner";
import type { CreateCommentRequest, Comment as BaseComment } from "../../../api/services/comment.service";
import { ROLE_DOCTOR } from "../../../types/user.types";

// Extended Comment interface with role_id for proper doctor badge display
interface CommentWithRole extends BaseComment {
  user: BaseComment['user'] & {
    role_id?: number;
  };
  replies?: CommentWithRole[];
}

interface CommentSectionProps {
  articleId: number;
  allowComments?: boolean;
  commentsCount?: number;
}

interface CommentItemProps {
  comment: CommentWithRole;
  onReply: (commentId: number) => void;
  onEdit: (commentId: number, text: string) => void;
  onDelete: (commentId: number) => void;
  onLike: (commentId: number) => void;
  onReport: (commentId: number, reason: string) => void;
  currentUserId?: number;
  level?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onReport,
  currentUserId,
  level = 0
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.like_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment_text || "");
  const [showReplies, setShowReplies] = useState(true);
  const [showMoreActions, setShowMoreActions] = useState(false);

  const isOwner = currentUserId === comment.user_id;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: vi
    });
  };

  const handleLike = async () => {
    setIsLiking(true);
    try {
      const result = await commentService.toggleCommentLike(comment.comment_id);
      setIsLiked(result.liked);
      setLikeCount(result.like_count);
      onLike(comment.comment_id);
    } catch (error) {
      toast.error('Có lỗi khi thích bình luận');
    } finally {
      setIsLiking(false);
    }
  };

  const handleEdit = () => {
    if (editText.trim() && editText !== comment.comment_text) {
      onEdit(comment.comment_id, editText.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(comment.comment_text || "");
    setIsEditing(false);
  };

  return (
    <div className={`${level > 0 ? 'ml-8 mt-4' : ''}`}>
      <Card className="shadow-sm">
        <CardContent className="p-4">
          {/* Comment Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.user?.avatar_url || ""} />
                <AvatarFallback className="text-sm">
                  {comment.user?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {comment.user?.full_name || 'Người dùng'}
                  </span>
                  {comment.user?.role_id === ROLE_DOCTOR && (
                    <Badge variant="secondary" className="text-xs">
                      Bác sĩ
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(comment.created_at)}
                  {comment.updated_at !== comment.created_at && ' • đã chỉnh sửa'}
                </span>
              </div>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMoreActions(!showMoreActions)}
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>

              {showMoreActions && (
                <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-32">
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMoreActions(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Edit3 className="h-3 w-3" />
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => {
                          onDelete(comment.comment_id);
                          setShowMoreActions(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                      >
                        <Trash2 className="h-3 w-3" />
                        Xóa
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        onReport(comment.comment_id, 'inappropriate');
                        setShowMoreActions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                    >
                      <Flag className="h-3 w-3" />
                      Báo cáo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comment Content */}
          {isEditing ? (
            <div className="mb-3">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="mb-2"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit}>
                  Lưu
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Hủy
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-800 mb-3 whitespace-pre-wrap">
              {comment.comment_text}
            </p>
          )}

          {/* Comment Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={`h-8 px-2 ${isLiked ? 'text-red-600' : 'text-gray-600'}`}
            >
              {isLiking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              )}
              {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
            </Button>

            {level < 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment.comment_id)}
                className="h-8 px-2 text-gray-600"
              >
                <Reply className="h-4 w-4 mr-1" />
                <span className="text-xs">Trả lời</span>
              </Button>
            )}

            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="h-8 px-2 text-gray-600"
              >
                {showReplies ? (
                  <ChevronUp className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-1" />
                )}
                <span className="text-xs">
                  {comment.replies?.length || 0} phản hồi
                </span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      {hasReplies && showReplies && (
        <div className="mt-4">
          {comment.replies?.map((reply) => (
            <CommentItem
              key={reply.comment_id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onLike={onLike}
              onReport={onReport}
              currentUserId={currentUserId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentSection: React.FC<CommentSectionProps> = ({
  articleId,
  allowComments = true
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  // Load comments
  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await commentService.getArticleComments(articleId);
      // Cast to CommentWithRole since backend should include role_id
      setComments(data as CommentWithRole[]);
    } catch (error) {
      toast.error('Không thể tải bình luận');
    } finally {
      setIsLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Submit new comment
  const handleSubmitComment = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để bình luận');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Vui lòng nhập nội dung bình luận');
      return;
    }

    setIsSubmitting(true);
    try {
      const commentData: CreateCommentRequest = {
        content_id: articleId,
        comment_text: newComment.trim()
      };

      await commentService.addComment(commentData);
      setNewComment('');
      toast.success('Đã thêm bình luận thành công');
      await loadComments(); // Reload comments
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi khi thêm bình luận');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit reply
  const handleSubmitReply = async (parentId: number) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để trả lời');
      return;
    }

    if (!replyText.trim()) {
      toast.error('Vui lòng nhập nội dung trả lời');
      return;
    }

    try {
      const replyData: CreateCommentRequest = {
        content_id: articleId,
        comment_text: replyText.trim(),
        parent_comment_id: parentId
      };

      await commentService.addComment(replyData);
      setReplyText('');
      setReplyingTo(null);
      toast.success('Đã trả lời thành công');
      await loadComments(); // Reload comments
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi khi trả lời');
    }
  };

  // Handle edit comment
  const handleEditComment = async (commentId: number, text: string) => {
    try {
      await commentService.updateComment(commentId, text);
      toast.success('Đã cập nhật bình luận');
      await loadComments(); // Reload comments
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi khi cập nhật');
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: number) => {
    // Fix: Use window.confirm instead of confirm to avoid ESLint no-restricted-globals error
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    try {
      await commentService.deleteComment(commentId);
      toast.success('Đã xóa bình luận');
      await loadComments(); // Reload comments
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi khi xóa');
    }
  };

  // Handle like comment
  const handleLikeComment = (commentId: number) => {
    // Like handled in CommentItem component
    // This could be used for parent component updates if needed
  };

  // Handle report comment
  const handleReportComment = async (commentId: number, reason: string) => {
    try {
      await commentService.reportComment(commentId, reason);
      toast.success('Đã báo cáo bình luận');
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi khi báo cáo');
    }
  };

  // Handle reply
  const handleReply = (commentId: number) => {
    setReplyingTo(commentId);
    setReplyText('');
  };

  if (!allowComments) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Bình luận đã bị tắt cho bài viết này</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comments Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Bình luận ({comments.length})
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Add Comment Form */}
      {user ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={user.avatar_url || ""} />
                <AvatarFallback className="text-sm">
                  {user.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <Textarea
                  placeholder="Viết bình luận của bạn..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="mb-3"
                />

                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    {newComment.length}/1000 ký tự
                  </p>

                  <Button
                    onClick={handleSubmitComment}
                    disabled={isSubmitting || !newComment.trim()}
                    size="sm"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Gửi bình luận
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">
              Vui lòng đăng nhập để tham gia bình luận
            </p>
            <Button variant="outline">
              Đăng nhập
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            <p className="text-gray-600">Đang tải bình luận...</p>
          </CardContent>
        </Card>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.comment_id}>
              <CommentItem
                comment={comment}
                onReply={handleReply}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                onLike={handleLikeComment}
                onReport={handleReportComment}
                currentUserId={user?.user_id}
              />

              {/* Reply Form */}
              {replyingTo === comment.comment_id && (
                <div className="ml-8 mt-3">
                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="w-6 h-6 flex-shrink-0">
                          <AvatarImage src={user?.avatar_url || ""} />
                          <AvatarFallback className="text-xs">
                            {user?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <Textarea
                            placeholder={`Trả lời ${comment.user?.full_name || "người dùng"}...`}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={2}
                            className="mb-2"
                          />

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSubmitReply(comment.comment_id)}
                              disabled={!replyText.trim()}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Trả lời
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReplyingTo(null)}
                            >
                              Hủy
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Chưa có bình luận nào</p>
            <p className="text-sm mt-1">Hãy là người đầu tiên bình luận!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommentSection;