import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { Alert, AlertDescription } from "../../components/ui/alert";
import {
  Heart,
  Bookmark,
  BookmarkCheck,
  Share2,
  Eye,
  Clock,
  Calendar,
  ArrowLeft,
  MessageCircle,
  Loader2,
  Copy,
  Facebook,
  Twitter,
  Mail,
  CheckCircle,
  ThumbsUp,
  Download,
  Flag,
  Edit,
  Trash2,
  AlertTriangle,
  User,
  MapPin,
  Award,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuth } from "../../hooks/auth/useAuth";
import { articleService } from "../../api/services/article.sevice";
import CommentSection from "../../components/content/CommentSection/CommentSection";
import { toast } from "sonner";
import type { Article } from "../../types/content.types";

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const articleId = parseInt(id || '0');

  // States
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  // Load article
  useEffect(() => {
    const loadArticle = async () => {
      if (!articleId || articleId <= 0) {
        setError('ID bài viết không hợp lệ');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await articleService.getArticleDetail(articleId);
        setArticle(data);

        // Load related articles
        if (data.category) {
          loadRelatedArticles(data.category, data.article_id);
        }
      } catch (err: any) {
        console.error('Load article error:', err);
        setError(err.message || 'Không thể tải bài viết');
      } finally {
        setIsLoading(false);
      }
    };

    loadArticle();
  }, [articleId]);

  // Load related articles
  const loadRelatedArticles = async (category: string, excludeId: number) => {
    try {
      const response = await articleService.getArticles({
        category,
        limit: 4,
        status: 'published'
      });
      const filtered = response.data.filter(art => art.article_id !== excludeId);
      setRelatedArticles(filtered.slice(0, 3));
    } catch (error) {
      console.error('Load related articles error:', error);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: vi
    });
  };

  const formatFullDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  // Parse tags
  const parseTags = (tags?: string) => {
    if (!tags) return [];
    return tags.split(',').map(tag => tag.trim()).filter(Boolean);
  };

  // Handle like
  const handleLike = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thích bài viết');
      return;
    }

    if (!article) return;

    setIsLiking(true);
    try {
      const result = await articleService.toggleLike(article.article_id);

      setArticle(prev => prev ? {
        ...prev,
        interactions: {
          ...prev.interactions,
          likes: result.like_count,
        },
        userInteractions: {
          ...prev.userInteractions,
          isLiked: result.liked,
        }
      } : null);

      toast.success(result.liked ? 'Đã thích bài viết' : 'Đã bỏ thích bài viết');
    } catch (error: any) {
      toast.error('Có lỗi khi thích bài viết');
    } finally {
      setIsLiking(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu bài viết');
      return;
    }

    if (!article) return;

    setIsSaving(true);
    try {
      const result = await articleService.toggleSave(article.article_id);

      setArticle(prev => prev ? {
        ...prev,
        userInteractions: {
          ...prev.userInteractions,
          isSaved: result.saved,
        }
      } : null);

      toast.success(result.saved ? 'Đã lưu bài viết' : 'Đã bỏ lưu bài viết');
    } catch (error: any) {
      toast.error('Có lỗi khi lưu bài viết');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle share
  const handleShare = async (platform?: string) => {
    if (!article) return;

    const url = window.location.href;
    const title = article.title;
    const text = article.excerpt || title;

    setIsSharing(true);
    try {
      switch (platform) {
        case 'copy':
          await navigator.clipboard.writeText(url);
          toast.success('Đã sao chép link bài viết');
          break;

        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            '_blank',
            'width=600,height=400'
          );
          break;

        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
            '_blank',
            'width=600,height=400'
          );
          break;

        case 'email':
          window.open(
            `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`
          );
          break;

        default:
          if (navigator.share) {
            await navigator.share({ title, text, url });
          } else {
            await navigator.clipboard.writeText(url);
            toast.success('Đã sao chép link bài viết');
          }
      }

      // Record share
      await articleService.shareArticle(article.article_id, platform);
      setShowShareMenu(false);

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error('Có lỗi khi chia sẻ bài viết');
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Handle follow author
  const handleFollowAuthor = async () => {
    if (!user || !article?.author) {
      toast.error('Vui lòng đăng nhập để theo dõi tác giả');
      return;
    }

    try {
      // Implementation depends on your follow system
      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? 'Đã bỏ theo dõi' : 'Đã theo dõi tác giả');
    } catch (error) {
      toast.error('Có lỗi khi theo dõi tác giả');
    }
  };

  // Handle report
  const handleReport = async () => {
    if (!user || !article) {
      toast.error('Vui lòng đăng nhập để báo cáo');
      return;
    }

    const reason = prompt('Lý do báo cáo:');
    if (reason) {
      try {
        // Implementation depends on your report system
        toast.success('Đã gửi báo cáo thành công');
      } catch (error) {
        toast.error('Có lỗi khi gửi báo cáo');
      }
    }
  };

  // Check if user is author
  const isAuthor = user && article && user.user_id === article.author_id;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-600 mb-4" />
              <p className="text-lg text-gray-600">Đang tải bài viết...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Không tìm thấy bài viết'}
            </AlertDescription>
          </Alert>

          <div className="text-center">
            <Link to="/articles">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại danh sách bài viết
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link to="/articles">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>

          {isAuthor && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/articles/${article.article_id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Article Header */}
        <Card className="overflow-hidden">
          {/* Featured Image */}
          {(article.featured_image || article.featured_image_url) && (
            <div className="relative h-64 md:h-80 overflow-hidden">
              <img
                src={article.featured_image || article.featured_image_url}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

              {/* Category badge on image */}
              {article.category && (
                <Badge className="absolute top-4 left-4 bg-white text-gray-900">
                  {article.category}
                </Badge>
              )}
            </div>
          )}

          <CardContent className="p-8">
            {/* Category (if no image) */}
            {!article.featured_image && !article.featured_image_url && article.category && (
              <Badge variant="secondary" className="mb-4">
                {article.category}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {article.title}
            </h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {/* Author & Meta */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              {/* Author Info */}
              {article.author && (
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 ring-2 ring-blue-100">
                    <AvatarImage src={article.author.avatar_url} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {article.author.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {article.author.full_name}
                      </h3>
                      {article.author.verified && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                      {article.author.role_id === 2 && (
                        <Badge variant="outline" className="text-xs">
                          <Award className="h-3 w-3 mr-1" />
                          Bác sĩ
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(article.published_at || article.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.reading_time || 5} phút đọc
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.interactions.views || 0} lượt xem
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Follow Author */}
                {!isAuthor && article.author && (
                  <Button
                    variant={isFollowing ? "default" : "outline"}
                    size="sm"
                    onClick={handleFollowAuthor}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                  </Button>
                )}

                {/* Report */}
                {!isAuthor && (
                  <Button variant="ghost" size="sm" onClick={handleReport}>
                    <Flag className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Interaction Buttons */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-6">
              <div className="flex items-center gap-3">
                {/* Like Button */}
                <Button
                  variant={article.userInteractions.isLiked ? "default" : "outline"}
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`${
                    article.userInteractions.isLiked 
                      ? "bg-red-500 hover:bg-red-600 text-white" 
                      : ""
                  }`}
                >
                  {isLiking ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Heart className={`h-4 w-4 mr-2 ${
                      article.userInteractions.isLiked ? 'fill-current' : ''
                    }`} />
                  )}
                  {article.interactions.likes}
                </Button>

                {/* Comment Button */}
                <Button variant="outline" asChild>
                  <a href="#comments">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {article.interactions.comments_count || 0}
                  </a>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {/* Save Button */}
                <Button
                  variant={article.userInteractions.isSaved ? "default" : "outline"}
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`${
                    article.userInteractions.isSaved 
                      ? "bg-blue-500 hover:bg-blue-600 text-white" 
                      : ""
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : article.userInteractions.isSaved ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>

                {/* Share Button */}
                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    disabled={isSharing}
                  >
                    {isSharing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Share Menu */}
                  {showShareMenu && (
                    <div className="absolute right-0 top-12 bg-white border rounded-lg shadow-lg py-2 z-20 min-w-48">
                      <button
                        onClick={() => handleShare('copy')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
                      >
                        <Copy className="h-4 w-4" />
                        Sao chép link
                      </button>
                      <button
                        onClick={() => handleShare('facebook')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
                      >
                        <Facebook className="h-4 w-4 text-blue-600" />
                        Facebook
                      </button>
                      <button
                        onClick={() => handleShare('twitter')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
                      >
                        <Twitter className="h-4 w-4 text-blue-400" />
                        Twitter
                      </button>
                      <button
                        onClick={() => handleShare('email')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
                      >
                        <Mail className="h-4 w-4 text-gray-600" />
                        Email
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Article Content */}
        <Card>
          <CardContent className="p-8">
            <div
              className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
              style={{
                lineHeight: '1.8',
                fontSize: '18px'
              }}
            >
              {article.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-6">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        {article.tags && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {parseTags(article.tags).map((tag, index) => (
                  <Badge key={index} variant="outline" className="hover:bg-blue-50 cursor-pointer">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Author Profile */}
        {article.author && (
          <Card>
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-6">Về tác giả</h3>
              <div className="flex flex-col md:flex-row gap-6">
                <Avatar className="w-24 h-24 mx-auto md:mx-0">
                  <AvatarImage src={article.author.avatar_url} />
                  <AvatarFallback className="text-2xl font-semibold">
                    {article.author.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <h4 className="text-xl font-semibold">
                      {article.author.full_name}
                    </h4>
                    {article.author.verified && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                    {article.author.role_id === 2 && (
                      <Badge className="bg-green-100 text-green-800">
                        <Award className="h-3 w-3 mr-1" />
                        Bác sĩ chuyên khoa
                      </Badge>
                    )}
                  </div>

                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {article.author.role_id === 2
                      ? "Bác sĩ chuyên khoa với nhiều năm kinh nghiệm trong lĩnh vực chăm sóc sức khỏe trẻ em. Cam kết mang đến những thông tin y tế chính xác và hữu ích cho cha mẹ."
                      : "Chuyên gia chia sẻ kiến thức về chăm sóc sức khỏe và nuôi dạy trẻ."
                    }
                  </p>

                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/authors/${article.author.id}`}>
                        <User className="h-4 w-4 mr-2" />
                        Xem hồ sơ
                      </Link>
                    </Button>

                    {!isAuthor && (
                      <Button
                        variant={isFollowing ? "default" : "outline"}
                        size="sm"
                        onClick={handleFollowAuthor}
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Bài viết liên quan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedArticles.map((relatedArticle) => (
                  <Link
                    key={relatedArticle.article_id}
                    to={`/articles/${relatedArticle.article_id}`}
                    className="group"
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      {relatedArticle.featured_image && (
                        <div className="h-40 overflow-hidden">
                          <img
                            src={relatedArticle.featured_image}
                            alt={relatedArticle.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h4 className="font-semibold line-clamp-2 mb-2 group-hover:text-blue-600">
                          {relatedArticle.title}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {relatedArticle.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {relatedArticle.interactions.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {relatedArticle.interactions.likes}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments Section */}
        <div id="comments">
          <CommentSection
            articleId={article.article_id}
            allowComments={article.allow_comments}
            commentsCount={article.interactions.comments_count}
          />
        </div>

        {/* Floating Action Buttons (Mobile) */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 md:hidden z-10">
          <Button
            size="sm"
            variant={article.userInteractions.isLiked ? "default" : "outline"}
            onClick={handleLike}
            disabled={isLiking}
            className="rounded-full w-14 h-14 shadow-lg"
          >
            {isLiking ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Heart className={`h-5 w-5 ${
                article.userInteractions.isLiked ? 'fill-current' : ''
              }`} />
            )}
          </Button>

          <Button
            size="sm"
            variant={article.userInteractions.isSaved ? "default" : "outline"}
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full w-14 h-14 shadow-lg"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : article.userInteractions.isSaved ? (
              <BookmarkCheck className="h-5 w-5" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleShare()}
            disabled={isSharing}
            className="rounded-full w-14 h-14 shadow-lg"
          >
            {isSharing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Share2 className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetailPage;