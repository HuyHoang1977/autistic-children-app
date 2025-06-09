import apiClient from "../client"
import { API_ENDPOINTS } from "../endpoints"
import type { LoginRequest, RegisterRequest, User } from "../../types"
import type { ApiResponse } from "../../types/api.types"

export const authService = {
  // Đăng nhập
  async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    )

    const { user, token } = response.data.data
    localStorage.setItem("auth_token", token)

    return { user, token }
  },

  // Đăng ký
  async register(userData: RegisterRequest): Promise<{ user: User; token: string }> {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
      API_ENDPOINTS.AUTH.REGISTER,
      userData,
    )

    const { user, token } = response.data.data
    localStorage.setItem("auth_token", token)

    return { user, token }
  },

  // Đăng xuất
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
    } finally {
      localStorage.removeItem("auth_token")
    }
  },

  // Lấy thông tin user hiện tại
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(API_ENDPOINTS.USERS.PROFILE)
    return response.data.data
  },

//   // Refresh token
//   async refreshToken(): Promise<{ token: string }> {
//     const response = await apiClient.post<ApiResponse<{ token: string }>>(API_ENDPOINTS.AUTH.REFRESH)

//     const { token } = response.data.data
//     localStorage.setItem("auth_token", token)

//     return { token }
//   },

//   // Quên mật khẩu
//   async forgotPassword(email: string): Promise<void> {
//     await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email })
//   },

//   // Đặt lại mật khẩu
//   async resetPassword(token: string, password: string): Promise<void> {
//     await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
//       token,
//       password,
//     })
//   },

//   // Xác minh email
//   async verifyEmail(token: string): Promise<void> {
//     await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token })
//   },
}