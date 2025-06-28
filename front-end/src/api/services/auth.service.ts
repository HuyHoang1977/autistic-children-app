import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type {
  LoginRequest,
  RegisterRequest,
  AuthenticatedUser,
  AuthResponse
} from "../../types";

// Token management constants
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

class AuthService {
  private tokenCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupTokenValidation();
  }

  // ==================== TOKEN MANAGEMENT ====================

  /**
   * Get stored authentication token
   */
  getToken(): string | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        console.log('🔑 Retrieved token:', `${token.substring(0, 20)}...`);

        // Validate token format
        if (!this.isValidJWTFormat(token)) {
          console.warn('⚠️ Invalid token format, clearing...');
          this.clearTokens();
          return null;
        }

        // Check if token is expired
        if (this.isTokenExpired(token)) {
          console.warn('⚠️ Token is expired, clearing...');
          this.clearTokens();
          return null;
        }

        return token;
      }

      console.log('🔑 No token found');
      return null;
    } catch (error) {
      console.error('❌ Error retrieving token:', error);
      return null;
    }
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('❌ Error retrieving refresh token:', error);
      return null;
    }
  }

  /**
   * Store authentication tokens
   */
  setTokens(accessToken: string, refreshToken?: string): void {
    try {
      console.log('💾 Storing tokens...');

      // Validate access token
      if (!accessToken) {
        throw new Error('Access token is required');
      }

      if (!this.isValidJWTFormat(accessToken)) {
        throw new Error('Invalid access token format');
      }

      console.log('🔑 Access token:', `${accessToken.substring(0, 20)}...`);
      console.log('🔄 Refresh token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null');

      localStorage.setItem(TOKEN_KEY, accessToken);

      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }

      console.log('✅ Tokens stored successfully');

      // Start token validation interval
      this.setupTokenValidation();

    } catch (error) {
      console.error('❌ Error storing tokens:', error);
      throw error;
    }
  }

  /**
   * Clear all authentication data
   */
  clearTokens(): void {
    try {
      const hadToken = !!localStorage.getItem(TOKEN_KEY);

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      // Clear token validation interval
      if (this.tokenCheckInterval) {
        clearInterval(this.tokenCheckInterval);
        this.tokenCheckInterval = null;
      }

      console.log('🧹 Tokens cleared' + (hadToken ? ' (had token before)' : ' (no token found)'));
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const isAuth = !!token;
    console.log('🔐 Authentication status:', isAuth);
    return isAuth;
  }

  // ==================== TOKEN VALIDATION ====================

  /**
   * Validate JWT token format
   */
  private isValidJWTFormat(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // Try to decode header and payload
      JSON.parse(atob(parts[0])); // header
      JSON.parse(atob(parts[1])); // payload

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      return payload.exp <= currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Setup automatic token validation
   */
  private setupTokenValidation(): void {
    // Clear existing interval
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
    }

    // Check token every 30 seconds
    this.tokenCheckInterval = setInterval(() => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && this.isTokenExpired(token)) {
        console.log('🕐 Token expired, attempting refresh...');
        this.attemptTokenRefresh();
      }
    }, 30000);
  }

  /**
   * Attempt to refresh expired token
   */
  private async attemptTokenRefresh(): Promise<void> {
    try {
      const newToken = await this.refreshToken();
      console.log('✅ Token refreshed automatically');
    } catch (error) {
      console.log('❌ Auto refresh failed, logging out...');
      this.clearTokens();
      window.location.href = '/login';
    }
  }

  // ==================== API METHODS ====================

  /**
   * User login
   */
  async login(credentials: LoginRequest): Promise<{ user: AuthenticatedUser; token: string }> {
    try {
      console.log('🚀 Attempting login with:', { email: credentials.email });

      // Clear any existing tokens before login
      this.clearTokens();

      // Validate input
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      const response = await apiClient.post<{
        success: boolean;
        data?: {
          user: AuthenticatedUser;
          token: string;
          refresh_token?: string;
        };
        errors?: Array<string | { field: string; message: string }>;
        error?: string;
      }>(API_ENDPOINTS.AUTH.LOGIN, {
        email: credentials.email.trim(),
        password: credentials.password
      });

      console.log('📥 Login response:', {
        status: response.status,
        success: response.data.success
      });

      // Check if request was successful
      if (!response.data.success || !response.data.data) {
        const errorMessages = this.extractErrorMessages(response.data);
        throw new Error(errorMessages.join("; "));
      }

      const { user, token, refresh_token } = response.data.data;

      // Validate response data
      if (!user || !token) {
        throw new Error('Invalid response: missing user or token');
      }

      // Store tokens and user data
      this.setTokens(token, refresh_token);
      this.setUserData(user);

      // Verify token was stored correctly
      const storedToken = this.getToken();
      if (storedToken !== token) {
        throw new Error('Failed to store authentication token');
      }

      console.log('✅ Login successful for user:', user.email);
      return { user, token };

    } catch (error: any) {
      console.error("❌ Login failed:", error);
      this.clearTokens();

      if (error.response?.data) {
        const errorMessages = this.extractErrorMessages(error.response.data);
        throw new Error(errorMessages.join("; "));
      }

      throw new Error(error.message || "Login failed");
    }
  }

  /**
   * User registration
   */
  async register(userData: RegisterRequest): Promise<{ user: AuthenticatedUser; token: string }> {
    try {
      console.log('🚀 Attempting registration with:', {
        email: userData.email,
        username: userData.username,
        role_id: userData.role_id
      });

      // Clear any existing tokens before registration
      this.clearTokens();

      // Validate required fields
      const requiredFields = ['email', 'password', 'username', 'full_name', 'role_id'];
      for (const field of requiredFields) {
        if (!userData[field as keyof RegisterRequest]) {
          throw new Error(`${field} is required`);
        }
      }

      const response = await apiClient.post<{
        success: boolean;
        data?: {
          user: AuthenticatedUser;
          token: string;
          refresh_token?: string;
        };
        errors?: Array<string | { field: string; message: string }>;
        error?: string;
      }>(API_ENDPOINTS.AUTH.REGISTER, userData);

      console.log('📥 Registration response:', {
        status: response.status,
        success: response.data.success
      });

      // Check if request was successful
      if (!response.data.success || !response.data.data) {
        const errorMessages = this.extractErrorMessages(response.data);
        throw new Error(errorMessages.join("; "));
      }

      const { user, token, refresh_token } = response.data.data;

      // Validate response data
      if (!user || !token) {
        throw new Error('Invalid response: missing user or token');
      }

      // Store tokens and user data
      this.setTokens(token, refresh_token);
      this.setUserData(user);

      console.log('✅ Registration successful for user:', user.email);
      return { user, token };

    } catch (error: any) {
      console.error("❌ Registration failed:", error);
      this.clearTokens();

      if (error.response?.data) {
        const errorMessages = this.extractErrorMessages(error.response.data);
        throw new Error(errorMessages.join("; "));
      }

      throw new Error(error.message || "Registration failed");
    }
  }

  /**
   * User logout
   */
  async logout(): Promise<void> {
    try {
      console.log('🚀 Attempting logout...');

      // Try to call logout endpoint
      try {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
        console.log('✅ Server logout successful');
      } catch (logoutError) {
        console.warn('⚠️ Server logout failed, continuing with local logout:', logoutError);
      }

    } catch (error: any) {
      console.error("❌ Logout error:", error);
    } finally {
      // Always clear tokens regardless of server response
      this.clearTokens();
      console.log('✅ Local logout completed');
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<AuthenticatedUser> {
    try {
      console.log('🚀 Fetching current user...');

      // Check if we have cached user data
      const cachedUser = this.getCachedUserData();
      if (cachedUser) {
        console.log('✅ Returning cached user data');
        return cachedUser;
      }

      const response = await apiClient.get<{
        success: boolean;
        data?: AuthenticatedUser;
        errors?: Array<string | { field: string; message: string }>;
        error?: string;
      }>(API_ENDPOINTS.USERS.PROFILE);

      console.log('📥 Get current user response:', {
        status: response.status,
        success: response.data.success
      });

      if (!response.data.success || !response.data.data) {
        const errorMessages = this.extractErrorMessages(response.data);
        throw new Error(errorMessages.join("; "));
      }

      const user = response.data.data;
      this.setUserData(user);

      return user;

    } catch (error: any) {
      console.error("❌ Failed to fetch current user:", error);

      // If unauthorized, clear tokens
      if (error.response?.status === 401) {
        console.log('🧹 Unauthorized - clearing tokens');
        this.clearTokens();
      }

      if (error.response?.data) {
        const errorMessages = this.extractErrorMessages(error.response.data);
        throw new Error(errorMessages.join("; "));
      }

      throw new Error(error.message || "Failed to fetch current user");
    }
  }

  /**
   * Force refresh current user information (no cache)
   */
  async refreshCurrentUser(): Promise<AuthenticatedUser> {
    try {
      console.log('🔄 Force refreshing current user...');

      const response = await apiClient.get<{
        success: boolean;
        data?: AuthenticatedUser;
        errors?: Array<string | { field: string; message: string }>;
        error?: string;
      }>(API_ENDPOINTS.USERS.PROFILE);

      console.log('📥 Force refresh user response:', {
        status: response.status,
        success: response.data.success
      });

      if (!response.data.success || !response.data.data) {
        const errorMessages = this.extractErrorMessages(response.data);
        throw new Error(errorMessages.join("; "));
      }

      const user = response.data.data;
      this.setUserData(user);

      console.log('✅ User data force refreshed:', user);
      return user;

    } catch (error: any) {
      console.error("❌ Failed to force refresh current user:", error);

      // If unauthorized, clear tokens
      if (error.response?.status === 401) {
        console.log('🧹 Unauthorized - clearing tokens');
        this.clearTokens();
      }

      if (error.response?.data) {
        const errorMessages = this.extractErrorMessages(error.response.data);
        throw new Error(errorMessages.join("; "));
      }

      throw new Error(error.message || "Failed to force refresh current user");
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('🔄 Refreshing token...');

      const response = await apiClient.post<{
        success: boolean;
        data?: { token: string };
        error?: string;
      }>(API_ENDPOINTS.AUTH.REFRESH, {}, {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Token refresh failed');
      }

      const { token } = response.data.data;

      // Update stored token
      this.setTokens(token, refreshToken);

      console.log('✅ Token refreshed successfully');
      return token;

    } catch (error: any) {
      console.error('❌ Token refresh failed:', error);
      this.clearTokens();
      throw error;
    }
  }

  // ==================== USER DATA MANAGEMENT ====================

  /**
   * Store user data in localStorage
   */
  private setUserData(user: AuthenticatedUser): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      console.log('💾 User data stored');
    } catch (error) {
      console.error('❌ Error storing user data:', error);
    }
  }

  /**
   * Get cached user data
   */
  private getCachedUserData(): AuthenticatedUser | null {
    try {
      const userData = localStorage.getItem(USER_KEY);
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('❌ Error retrieving user data:', error);
      return null;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Extract error messages from API response
   */
  private extractErrorMessages(responseData: any): string[] {
    if (responseData.errors) {
      return responseData.errors.map((err: any) =>
        typeof err === 'string' ? err : `${err.field}: ${err.message}`
      );
    }

    if (responseData.error) {
      return [responseData.error];
    }

    if (responseData.message) {
      return [responseData.message];
    }

    return ['Unknown error occurred'];
  }

  /**
   * Debug token status - for development
   */
  debugTokenStatus(): void {
    console.log('🔍 === TOKEN DEBUG STATUS ===');

    const token = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const userData = localStorage.getItem(USER_KEY);

    console.log('Storage Status:');
    console.log('- Has access token:', !!token);
    console.log('- Has refresh token:', !!refreshToken);
    console.log('- Has user data:', !!userData);
    console.log('- LocalStorage available:', typeof Storage !== 'undefined');

    if (token) {
      console.log('\nToken Details:');
      console.log('- Token preview:', `${token.substring(0, 30)}...`);
      console.log('- Token length:', token.length);
      console.log('- Valid JWT format:', this.isValidJWTFormat(token));
      console.log('- Is expired:', this.isTokenExpired(token));

      // Decode token payload
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('- Token expires:', new Date(payload.exp * 1000));
          console.log('- Token subject:', payload.sub || payload.identity || 'not specified');
          console.log('- Time until expiry:', Math.max(0, payload.exp * 1000 - Date.now()), 'ms');
        }
      } catch (e) {
        console.log('- Token decode error:', e);
      }
    }

    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('\nUser Data:');
        console.log('- User ID:', user.user_id);
        console.log('- Email:', user.email);
        console.log('- Role:', user.role_id);
      } catch (e) {
        console.log('- User data parse error:', e);
      }
    }

    console.log('🔍 === END DEBUG ===');
  }

  /**
   * Test authentication with backend
   */
  async testAuth(): Promise<boolean> {
    try {
      console.log('🔍 Testing authentication...');

      const token = this.getToken();
      if (!token) {
        console.log('❌ No token found');
        return false;
      }

      // Test with current user endpoint
      await this.getCurrentUser();

      console.log('✅ Auth test successful');
      return true;
    } catch (error: any) {
      console.error('❌ Auth test failed:', error);

      if (error.response?.status === 401) {
        console.log('🔓 Authentication invalid');
        this.clearTokens();
      }

      return false;
    }
  }

  /**
   * Cleanup method - call this when component unmounts
   */
  cleanup(): void {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    authService.cleanup();
  });
}