// API related types

// Base API Response wrapper - Updated with error support
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string; // ✅ Added error field
  errors?: Record<string, string[]> | Array<string | { field: string; message: string }>; // ✅ Updated errors
}

// Paginated response - Updated with error support
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  message?: string; // ✅ Added message field
  error?: string; // ✅ Added error field
  errors?: Array<string | { field: string; message: string }>; // ✅ Added errors field
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
}

// Error response
export interface ApiError {
  success: false;
  message: string;
  error?: string; // ✅ Added error field for consistency
  errors?: Record<string, string[]> | Array<string | { field: string; message: string }>;
  status_code: number;
}

// Search/Filter params
export interface SearchParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// Request headers
export interface ApiHeaders {
  'Content-Type'?: string;
  'Authorization'?: string;
  'Accept'?: string;
  'X-Requested-With'?: string;
  [key: string]: string | undefined;
}

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

// API request config
export interface ApiRequestConfig {
  url: string;
  method: HttpMethod;
  headers?: ApiHeaders;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
}

// Validation error
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

// ✅ Added API Error class for better error handling
export class CustomApiError extends Error {
  public response?: {
    status: number;
    statusText: string;
    data: ApiResponse<any>;
  };
  public code?: string;

  constructor(
    message: string,
    response?: {
      status: number;
      statusText: string;
      data: ApiResponse<any>;
    },
    code?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.response = response;
    this.code = code;
  }
}

// ✅ Type Guards for API responses
export function isApiResponse<T>(response: any): response is ApiResponse<T> {
  return (
    response &&
    typeof response === 'object' &&
    'success' in response
  );
}

export function isPaginatedResponse<T>(response: any): response is PaginatedResponse<T> {
  return (
    response &&
    typeof response === 'object' &&
    'success' in response &&
    'data' in response &&
    'pagination' in response &&
    Array.isArray(response.data)
  );
}

export function isApiError(error: any): error is CustomApiError {
  return error instanceof CustomApiError || (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    'status' in error.response
  );
}

export function isValidationError(error: any): error is ValidationError {
  return (
    error &&
    typeof error === 'object' &&
    'field' in error &&
    'message' in error
  );
}

// ✅ Response status constants
export const API_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// ✅ Helper function to extract error messages
export function extractErrorMessages(response: ApiResponse<any> | ApiError): string[] {
  const messages: string[] = [];

  if (response.error) {
    messages.push(response.error);
  }

  if (response.message && response.message !== response.error) {
    messages.push(response.message);
  }

  if (response.errors) {
    if (Array.isArray(response.errors)) {
      response.errors.forEach(err => {
        if (typeof err === 'string') {
          messages.push(err);
        } else if (typeof err === 'object' && err.field && err.message) {
          messages.push(`${err.field}: ${err.message}`);
        }
      });
    } else if (typeof response.errors === 'object') {
      Object.entries(response.errors).forEach(([field, fieldErrors]) => {
        if (Array.isArray(fieldErrors)) {
          fieldErrors.forEach(error => {
            messages.push(`${field}: ${error}`);
          });
        }
      });
    }
  }

  return messages.length > 0 ? messages : ['Unknown error occurred'];
}