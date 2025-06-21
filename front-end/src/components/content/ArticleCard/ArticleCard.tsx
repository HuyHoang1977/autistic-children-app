import type React from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardFooter } from "../../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { Badge } from "../../ui/badge"
import { Heart, MessageSquare, Eye, Clock, CheckCircle2 } from "lucide-react"
import { formatRelativeTime, formatNumber, truncateText } from "../../../utils/helper"
import type { Article } from "../../../types"
import { ROLE_DOCTOR } from "../../../types/user.types"

interface ArticleCardProps {
  article: Article
  variant?: "default" | "featured" | "compact"
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, variant = "default" }) => {
  const isFeatured = variant === "featured"
  const isCompact = variant === "compact"

  // Safe getters to handle optional fields
  const getExcerpt = (): string => {
    return article.excerpt || ''
  }

  const getViewCount = (): number => {
    return article.view_count || article.views || article.interactions.views || 0
  }

  const getCommentsCount = (): number => {
    return article.interactions.comments ||
           article.interactions.comments_count ||
           article.comment_count || 0
  }

  const getLikesCount = (): number => {
    return article.interactions.likes || article.like_count || 0
  }

  const getReadingTime = (): number => {
    return article.reading_time || 5 // Default to 5 minutes if not provided
  }

  const getAuthorInitials = (): string => {
    if (!article.author?.full_name) return "U"
    return article.author.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getAuthorId = (): number => {
    return article.author?.user_id || article.author?.id || 0
  }

  return (
    <Card className={`overflow-hidden h-full flex flex-col ${isFeatured ? "border-blue-200" : ""}`}>
      <Link to={`/articles/${article.article_id}`} className="block overflow-hidden">
        <div
          className={`relative overflow-hidden ${isCompact ? "h-32" : "h-48"} bg-gray-100`}
          style={{
            backgroundImage: `url(${article.featured_image || article.featured_image_url || "/placeholder.svg?height=300&width=500"})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {isFeatured && <Badge className="absolute top-2 left-2 bg-blue-600">Nổi bật</Badge>}
        </div>
      </Link>

      <CardContent className={`flex-1 flex flex-col ${isCompact ? "p-3" : "p-4"}`}>
        {/* Categories - Handle both formats */}
        {!isCompact && (
          <>
            {/* Array format categories */}
            {article.categories && article.categories.length > 0 && (
              <div className="mb-2">
                <Badge variant="outline" className="text-xs">
                  {article.categories[0].name}
                </Badge>
              </div>
            )}
            {/* Single category format fallback */}
            {(!article.categories || article.categories.length === 0) && article.category && (
              <div className="mb-2">
                <Badge variant="outline" className="text-xs">
                  {article.category}
                </Badge>
              </div>
            )}
          </>
        )}

        {/* Title */}
        <Link to={`/articles/${article.article_id}`} className="block">
          <h3
            className={`font-bold text-gray-900 hover:text-blue-600 transition-colors ${
              isCompact ? "text-base line-clamp-2" : "text-xl mb-2"
            }`}
          >
            {article.title}
          </h3>
        </Link>

        {/* Excerpt - Only show if exists */}
        {!isCompact && getExcerpt() && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {truncateText(getExcerpt(), 120)}
          </p>
        )}

        {/* Author - Handle null author gracefully */}
        <div className="flex items-center mt-auto">
          <Avatar className={`${isCompact ? "h-6 w-6" : "h-8 w-8"} mr-2`}>
            <AvatarImage
              src={article.author?.avatar_url || "/placeholder.svg?height=32&width=32"}
              alt={article.author?.full_name || 'Anonymous'}
            />
            <AvatarFallback>
              {getAuthorInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center">
              {article.author ? (
                <>
                  <Link
                    to={`/profile/${getAuthorId()}`}
                    className={`font-medium hover:text-blue-600 transition-colors ${isCompact ? "text-xs" : "text-sm"}`}
                  >
                    {article.author.full_name}
                  </Link>
                  {article.author.role_id === ROLE_DOCTOR && article.author.verified && (
                    <CheckCircle2 className={`text-blue-600 ml-1 ${isCompact ? "h-3 w-3" : "h-4 w-4"}`} />
                  )}
                </>
              ) : (
                <span className={`font-medium text-gray-500 ${isCompact ? "text-xs" : "text-sm"}`}>
                  Anonymous
                </span>
              )}
            </div>
            {!isCompact && (
              <div className="text-xs text-gray-500">
                {formatRelativeTime(article.created_at)}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className={`border-t flex justify-between items-center ${isCompact ? "px-3 py-2" : "px-4 py-3"}`}>
        <div className="flex items-center space-x-3 text-gray-500 text-xs">
          <div className="flex items-center">
            <Heart
              className={`${isCompact ? "h-3 w-3" : "h-4 w-4"} mr-1 ${
                article.userInteractions?.isLiked ? "fill-red-600 text-red-600" : ""
              }`}
            />
            <span>{formatNumber(getLikesCount())}</span>
          </div>
          <div className="flex items-center">
            <MessageSquare className={`${isCompact ? "h-3 w-3" : "h-4 w-4"} mr-1`} />
            <span>{formatNumber(getCommentsCount())}</span>
          </div>
          <div className="flex items-center">
            <Eye className={`${isCompact ? "h-3 w-3" : "h-4 w-4"} mr-1`} />
            <span>{formatNumber(getViewCount())}</span>
          </div>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <Clock className={`${isCompact ? "h-3 w-3" : "h-4 w-4"} mr-1`} />
          <span>{getReadingTime()} phút</span>
        </div>
      </CardFooter>
    </Card>
  )
}

export default ArticleCard