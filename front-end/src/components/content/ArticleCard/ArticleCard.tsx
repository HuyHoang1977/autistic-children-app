import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  BookmarkCheck,
  Clock,
  Eye,
  Calendar,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { articleService } from "../../../api/services/article.sevice"; // FIXED: Corrected path
import { useAuth } from "../../../hooks/auth/useAuth";
import { toast } from "sonner";
import type { Article } from "../../../types/content.types"; // FIXED: Import from types

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'featured' | 'compact' | 'list';
  showAuthor?: boolean;
  showActions?: boolean;
  onLike?: (articleId: number, liked: boolean) => void;
  onSave?: (articleId: number, saved: boolean) => void;
  onShare?: (articleId: number) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  variant = 'default',
  showAuthor = true,
  showActions = true,
  onLike,
  onSave,
  onShare
}) => {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localLiked, setLocalLiked] = useState(article.userInteractions.isLiked);
  const [localSaved, setLocalSaved] = useState(article.userInteractions.isSaved);
  const [localLikeCount, setLocalLikeCount] = useState(article.interactions.likes);

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: vi
    });
  };

  const parseTags = (tags?: string) => {
    if (!tags) return [];
    return tags.split(',').map(tag => tag.trim()).filter(Boolean).slice(0, 3);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Vui lòng đăng nhập để thích bài viết');
      return;
    }

    setIsLiking(true);
    try {
      const result = await articleService.toggleLike(article.article_id);

      setLocalLiked(result.liked);
      setLocalLikeCount(result.like_count);

      onLike?.(article.article_id, result.liked);

      toast.success(result.liked ? 'Đã thích bài viết' : 'Đã bỏ thích bài viết');
    } catch (error: any) {
      toast.error('Có lỗi xảy ra khi thích bài viết');
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu bài viết');
      return;
    }

    setIsSaving(true);
    try {
      const result = await articleService.toggleSave(article.article_id);

      setLocalSaved(result.saved);
      onSave?.(article.article_id, result.saved);

      toast.success(result.saved ? 'Đã lưu bài viết' : 'Đã bỏ lưu bài viết');
    } catch (error: any) {
      toast.error('Có lỗi xảy ra khi lưu bài viết');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/articles/${article.article_id}`;
    const title = article.title;
    const text = article.excerpt || title;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Đã sao chép link bài viết');
      }

      onShare?.(article.article_id);

      // Record share
      await articleService.shareArticle(article.article_id);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error('Có lỗi khi chia sẻ bài viết');
      }
    }
  };

  // FIXED: Added safe defaults for potentially undefined values
  const safeReadingTime = article.reading_time || 5;
  const safeViews = article.interactions.views || 0;
  const safeCommentsCount = article.interactions.comments_count || 0;
  const safeExcerpt = article.excerpt || '';
  const safeFeaturedImage = article.featured_image || article.featured_image_url;

  const renderCompactCard = () => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <Link to={`/articles/${article.article_id}`}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            {safeFeaturedImage && (
              <div className="w-20 h-20 flex-shrink-0">
                <img
                  src={safeFeaturedImage}
                  alt={article.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                {article.title}
              </h3>

              {safeExcerpt && (
                <p className="text-gray-600 text-xs line-clamp-2 mb-2">
                  {truncateText(safeExcerpt, 100)}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>{safeReadingTime}m</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {localLikeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {safeCommentsCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );

  const renderListCard = () => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <Link to={`/articles/${article.article_id}`}>
        <CardContent className="p-0">
          <div className="flex">
            {safeFeaturedImage && (
              <div className="w-48 h-32 flex-shrink-0">
                <img
                  src={safeFeaturedImage}
                  alt={article.title}
                  className="w-full h-full object-cover rounded-l-lg"
                />
              </div>
            )}

            <div className="flex-1 p-4">
              {/* Category */}
              {article.category && (
                <Badge variant="secondary" className="mb-2">
                  {article.category}
                </Badge>
              )}

              <h3 className="font-semibold text-lg line-clamp-2 mb-2">
                {article.title}
              </h3>

              {safeExcerpt && (
                <p className="text-gray-600 line-clamp-2 mb-3">
                  {safeExcerpt}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex items-center justify-between">
                {showAuthor && article.author && (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={article.author.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {article.author.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600">
                      {article.author.full_name}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(article.published_at || article.created_at)}
                    </span>
                  </div>
                )}

                {showActions && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      disabled={isLiking}
                      className={`h-8 px-2 ${localLiked ? 'text-red-600' : 'text-gray-600'}`}
                    >
                      {isLiking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Heart className={`h-4 w-4 ${localLiked ? 'fill-current' : ''}`} />
                      )}
                      <span className="ml-1 text-xs">{localLikeCount}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`h-8 px-2 ${localSaved ? 'text-blue-600' : 'text-gray-600'}`}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : localSaved ? (
                        <BookmarkCheck className="h-4 w-4" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="h-8 px-2 text-gray-600"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );

  const renderDefaultCard = () => (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <Link to={`/articles/${article.article_id}`} className="block">
        {/* Featured Image */}
        {safeFeaturedImage && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={safeFeaturedImage}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
            />

            {/* Category Badge */}
            {article.category && (
              <Badge
                variant="secondary"
                className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm"
              >
                {article.category}
              </Badge>
            )}

            {/* Reading Time */}
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {safeReadingTime}m
            </div>
          </div>
        )}

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 mb-2 hover:text-blue-600 transition-colors">
            {article.title}
          </h3>

          {/* Excerpt */}
          {safeExcerpt && (
            <p className="text-gray-600 text-sm line-clamp-3 mb-3">
              {safeExcerpt}
            </p>
          )}

          {/* Tags */}
          {article.tags && (
            <div className="flex flex-wrap gap-1 mb-3">
              {parseTags(article.tags).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Author & Meta */}
          {showAuthor && article.author && (
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={article.author.avatar_url} />
                <AvatarFallback className="text-sm">
                  {article.author.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {article.author.full_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(article.published_at || article.created_at)}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{safeViews}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`h-9 px-3 ${localLiked ? 'text-red-600 bg-red-50' : 'text-gray-600'}`}
                >
                  {isLiking ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Heart className={`h-4 w-4 mr-2 ${localLiked ? 'fill-current' : ''}`} />
                  )}
                  <span className="text-sm">{localLikeCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-gray-600"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Navigate to comments section
                    window.location.href = `/articles/${article.article_id}#comments`;
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">{safeCommentsCount}</span>
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`h-9 px-3 ${localSaved ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : localSaved ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="h-9 px-3 text-gray-600"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );

  const renderFeaturedCard = () => (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-blue-50">
      <Link to={`/articles/${article.article_id}`} className="block">
        {/* Featured Image */}
        {safeFeaturedImage && (
          <div className="relative h-56 overflow-hidden">
            <img
              src={safeFeaturedImage}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />

            {/* Featured Badge */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                ⭐ Nổi bật
              </Badge>
            </div>

            {/* Category */}
            {article.category && (
              <Badge
                variant="secondary"
                className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm"
              >
                {article.category}
              </Badge>
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        )}

        <CardContent className="p-6">
          {/* Title */}
          <h3 className="font-bold text-xl line-clamp-2 mb-3 hover:text-blue-600 transition-colors">
            {article.title}
          </h3>

          {/* Excerpt */}
          {safeExcerpt && (
            <p className="text-gray-600 line-clamp-3 mb-4 leading-relaxed">
              {safeExcerpt}
            </p>
          )}

          {/* Author & Stats */}
          <div className="flex items-center justify-between mb-4">
            {showAuthor && article.author && (
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 ring-2 ring-blue-100">
                  <AvatarImage src={article.author.avatar_url} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                    {article.author.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="font-medium text-gray-900">
                    {article.author.full_name}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(article.published_at || article.created_at)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{safeViews}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{safeReadingTime}m</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {article.tags && (
            <div className="flex flex-wrap gap-2 mb-4">
              {parseTags(article.tags).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs hover:bg-blue-50 transition-colors">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`h-10 px-4 rounded-full ${
                    localLiked 
                      ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {isLiking ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Heart className={`h-4 w-4 mr-2 ${localLiked ? 'fill-current' : ''}`} />
                  )}
                  <span className="font-medium">{localLikeCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 px-4 rounded-full text-gray-600 hover:bg-gray-50"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `/articles/${article.article_id}#comments`;
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span className="font-medium">{safeCommentsCount}</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`h-10 px-4 rounded-full ${
                    localSaved 
                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : localSaved ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="h-10 px-4 rounded-full text-gray-600 hover:bg-gray-50"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );

  // Render based on variant
  switch (variant) {
    case 'compact':
      return renderCompactCard();
    case 'list':
      return renderListCard();
    case 'featured':
      return renderFeaturedCard();
    default:
      return renderDefaultCard();
  }
};

export default ArticleCard;