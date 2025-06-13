"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../auth/useAuth"
import { articleService } from "../../api/services/article.sevice"
import type { Article, ArticleFilters } from "../../types"
import { UserRole } from "../../types"

export const useArticles = (filters: ArticleFilters = {}) => {
  const { user } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const fetchArticles = useCallback(
    async (reset = false) => {
      setIsLoading(true)
      setError(null)

      try {
        const currentPage = reset ? 1 : page
        const response = await articleService.getArticles({
          ...filters,
          page: currentPage,
          limit: 10,
        })

        if (reset) {
          setArticles(response.data)
          setPage(2)
        } else {
          setArticles((prev) => [...prev, ...response.data])
          setPage(currentPage + 1)
        }

        setHasMore(response.pagination.has_more)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch articles")
      } finally {
        setIsLoading(false)
      }
    },
    [filters, page],
  )

  useEffect(() => {
    setPage(1)
    fetchArticles(true)
  }, [filters])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchArticles()
    }
  }, [isLoading, hasMore, fetchArticles])

  const toggleLike = useCallback(
    async (content_id: number) => {
      if (!user || user.role === UserRole.GUEST) return

      try {
        const result = await articleService.toggleLike(content_id)

        setArticles((prev) =>
          prev.map((article) =>
            article.content_id === content_id
              ? {
                  ...article,
                  interactions: {
                    ...article.interactions,
                    likes: result.like_count,
                  },
                  userInteractions: {
                    ...article.userInteractions,
                    isLiked: result.liked,
                    isSaved: article.userInteractions?.isSaved || false,
                  },
                }
              : article,
          ),
        )

        return result
      } catch (err) {
        console.error("Failed to toggle like:", err)
        throw err
      }
    },
    [user],
  )

  const toggleSave = useCallback(
    async (article_id: number) => {
      if (!user || user.role !== UserRole.PARENT) return

      try {
        const result = await articleService.toggleSave(article_id)

        setArticles((prev) =>
          prev.map((article) =>
            article.article_id === article_id
              ? {
                  ...article,
                  userInteractions: {
                    ...article.userInteractions,
                    isSaved: result.saved,
                    isLiked: article.userInteractions?.isLiked || false,
                  },
                }
              : article,
          ),
        )

        return result
      } catch (err) {
        console.error("Failed to toggle save:", err)
        throw err
      }
    },
    [user],
  )

  return {
    articles,
    isLoading,
    error,
    hasMore,
    loadMore,
    toggleLike,
    toggleSave,
    refetch: () => fetchArticles(true),
  }
}

export const useArticleDetail = (article_id: number) => {
  const [article, setArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArticle = async () => {
      if (!article_id) return

      setIsLoading(true)
      setError(null)

      try {
        const data = await articleService.getArticleDetail(article_id)
        setArticle(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch article")
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticle()
  }, [article_id])

  const updateArticle = useCallback(
    (updatedData: Partial<Article>) => {
      if (article) {
        setArticle({ ...article, ...updatedData })
      }
    },
    [article],
  )

  return { article, isLoading, error, updateArticle }
}

// Hook for doctor's articles
export const useDoctorArticles = () => {
  const { user } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMyArticles = async () => {
      if (!user || user.role !== UserRole.DOCTOR) return

      setIsLoading(true)
      setError(null)

      try {
        const data = await articleService.getMyArticles()
        setArticles(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch articles")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyArticles()
  }, [user])

  const addArticle = useCallback((newArticle: Article) => {
    setArticles((prev) => [newArticle, ...prev])
  }, [])

  const updateArticle = useCallback((article_id: number, updatedData: Partial<Article>) => {
    setArticles((prev) =>
      prev.map((article) => (article.article_id === article_id ? { ...article, ...updatedData } : article)),
    )
  }, [])

  const removeArticle = useCallback((article_id: number) => {
    setArticles((prev) => prev.filter((article) => article.article_id !== article_id))
  }, [])

  return {
    articles,
    isLoading,
    error,
    addArticle,
    updateArticle,
    removeArticle,
  }
}

// Hook for parent's saved articles
export const useSavedArticles = () => {
  const { user } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSavedArticles = async () => {
      if (!user || user.role !== UserRole.PARENT) return

      setIsLoading(true)
      setError(null)

      try {
        const data = await articleService.getSavedArticles()
        setArticles(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch saved articles")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSavedArticles()
  }, [user])

  const removeSavedArticle = useCallback((article_id: number) => {
    setArticles((prev) => prev.filter((article) => article.article_id !== article_id))
  }, [])

  return { articles, isLoading, error, removeSavedArticle }
}
