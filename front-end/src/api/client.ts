import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

console.log('🔧 API Base URL:', API_BASE_URL);

// Tạo instance của axios với cấu hình tốt hơn
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Tăng timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor cho request với debugging tốt hơn
apiClient.interceptors.request.use(
  (config) => {
    console.log('📤 Request interceptor:');
    console.log('- Full URL:', `${config.baseURL}${config.url}`);
    console.log('- Method:', config.method?.toUpperCase());
    console.log('- Params:', config.params);

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('- Token added:', `Bearer ${token.substring(0, 20)}...`);
      } else {
        console.warn('⚠️ No token found for authenticated request');
      }
    }
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Interceptor cho response với xử lý lỗi tốt hơn
apiClient.interceptors.response.use(
  (response) => {
    console.log('📥 Response success:', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  (error) => {
    console.error('❌ Response error details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // Handle specific error cases
    if (error.response?.status === 401 && typeof window !== "undefined") {
      console.log('🔓 Unauthorized - clearing tokens and redirecting');
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
    } else if (error.response?.status === 422) {
      console.error('💥 Validation error (422):', error.response?.data);
    } else if (error.response?.status === 500) {
      console.error('🔥 Server error (500):', error.response?.data);
    } else if (!error.response) {
      console.error('🌐 Network error - no response received');
    }

    return Promise.reject(error);
  }
);

export default apiClient;