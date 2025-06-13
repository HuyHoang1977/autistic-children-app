import apiClient from "../client"
import { API_ENDPOINTS } from "../endpoints"
import type { Article, ArticleFilters, CreateArticleRequest, PaginatedResponse } from "../../types"
import type { ApiResponse } from "../../types/api.types"

export const articleService = {
  // Lấy danh sách bài viết
  async getArticles(filters: ArticleFilters = {}): Promise<PaginatedResponse<Article>> {
    const response = await apiClient.get<PaginatedResponse<Article>>(API_ENDPOINTS.ARTICLES.LIST, {
      params: filters,
    })
    return response.data
  },

  // Lấy chi tiết bài viết
  async getArticleDetail(article_id: number): Promise<Article> {
    const response = await apiClient.get<ApiResponse<Article>>(API_ENDPOINTS.ARTICLES.DETAIL(article_id))
    return response.data.data
  },

  // Tạo bài viết mới
  async createArticle(articleData: CreateArticleRequest): Promise<Article> {
    const response = await apiClient.post<ApiResponse<Article>>(API_ENDPOINTS.ARTICLES.CREATE, articleData)
    return response.data.data
  },

  // Cập nhật bài viết
  async updateArticle(article_id: number, articleData: Partial<CreateArticleRequest>): Promise<Article> {
    const response = await apiClient.put<ApiResponse<Article>>(API_ENDPOINTS.ARTICLES.UPDATE(article_id), articleData)
    return response.data.data
  },

  // Xóa bài viết
  async deleteArticle(article_id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ARTICLES.DELETE(article_id))
  },

  // Like/Unlike bài viết
  async toggleLike(content_id: number): Promise<{ liked: boolean; like_count: number }> {
    const response = await apiClient.post<ApiResponse<{ liked: boolean; like_count: number }>>(
      API_ENDPOINTS.ARTICLES.TOGGLE_LIKE(content_id),
    )
    return response.data.data
  },

  // Save/Unsave bài viết
  async toggleSave(article_id: number): Promise<{ saved: boolean }> {
    const response = await apiClient.post<ApiResponse<{ saved: boolean }>>(API_ENDPOINTS.ARTICLES.SAVE(article_id))
    return response.data.data
  },

  // Lấy bài viết của bác sĩ
  async getMyArticles(): Promise<Article[]> {
    const response = await apiClient.get<ApiResponse<Article[]>>(API_ENDPOINTS.ARTICLES.MY_ARTICLES)
    return response.data.data
  },

  // Lấy bài viết đã lưu
  async getSavedArticles(): Promise<Article[]> {
    const response = await apiClient.get<ApiResponse<Article[]>>(API_ENDPOINTS.ARTICLES.SAVED_ARTICLES)
    return response.data.data
  },

  // Lấy bài viết từ bác sĩ đang theo dõi
  async getFollowedDoctorsArticles(): Promise<Article[]> {
    const response = await apiClient.get<ApiResponse<Article[]>>(API_ENDPOINTS.ARTICLES.FOLLOWED_DOCTORS)
    return response.data.data
  },

  // Lấy bài viết nổi bật
  async getFeaturedArticles(): Promise<Article[]> {
    const response = await apiClient.get<ApiResponse<Article[]>>(API_ENDPOINTS.ARTICLES.FEATURED)
    return response.data.data
  },

  // Lấy bài viết trending
  async getTrendingArticles(): Promise<Article[]> {
    const response = await apiClient.get<ApiResponse<Article[]>>(API_ENDPOINTS.ARTICLES.TRENDING)
    return response.data.data
  },
}
