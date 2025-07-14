import apiClient from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface FollowResponse {
  success: boolean
  message: string
  is_following?: boolean
  followers_count?: number
  error?: string
}

export interface FollowStatusResponse {
  success: boolean
  is_following: boolean
  followed_at?: string
  message?: string
  error?: string
}

export class FollowService {
  /**
   * Toggle follow/unfollow doctor
   */
  async toggleFollowDoctor(doctorId: number): Promise<FollowResponse> {
    const response = await apiClient.post<FollowResponse>(
      API_ENDPOINTS.FOLLOW.TOGGLE_FOLLOW_DOCTOR(doctorId)
    )
    return response.data
  }

  /**
   * Check follow status with doctor
   */
  async checkFollowStatus(doctorId: number): Promise<FollowStatusResponse> {
    const response = await apiClient.get<FollowStatusResponse>(
      API_ENDPOINTS.FOLLOW.CHECK_FOLLOW_STATUS(doctorId)
    )
    return response.data
  }

  /**
   * Get followed doctors list
   */
  async getFollowedDoctors(page: number = 1, perPage: number = 10) {
    const response = await apiClient.get(
      `${API_ENDPOINTS.FOLLOW.FOLLOWED_DOCTORS}?page=${page}&per_page=${perPage}`
    )
    return response.data
  }

  /**
   * Get doctor followers count
   */
  async getDoctorFollowersCount(doctorId: number) {
    const response = await apiClient.get(
      API_ENDPOINTS.FOLLOW.DOCTOR_FOLLOWERS_COUNT(doctorId)
    )
    return response.data
  }

  /**
   * Get doctor followers list
   */
  async getDoctorFollowers(doctorId: number, page: number = 1, perPage: number = 10) {
    const response = await apiClient.get(
      `${API_ENDPOINTS.FOLLOW.DOCTOR_FOLLOWERS(doctorId)}?page=${page}&per_page=${perPage}`
    )
    return response.data
  }
}

export const followService = new FollowService()