import { API_ENDPOINTS } from "../endpoints";
import apiClient from "../client";
import {
  User,
  ParentInfo,
  DoctorInfo,
  ChildInfo,
  BaseUser,
  isParentUser,
  isDoctorUser,
  isAdminUser,
  isGuestUser,
  ParentUser,
  DoctorUser,
} from "../../types/user.types";

// Interface chuẩn cho response từ backend
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Interface cho avatar response - chuẩn hóa với backend
interface AvatarUploadResponse {
  avatar_url: string;
  file_size: number;
  content_type: string;
}

// Interface cho file validation
interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

// Constants cho avatar validation
const AVATAR_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'] as string[],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
} as const;

// Lấy profile (GET /profile)
export async function getProfile(): Promise<User> {
  const res = await apiClient.get<ApiResponse<User>>(API_ENDPOINTS.PROFILE.GET);
  if (res.data?.success && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data?.error || "Không thể lấy thông tin hồ sơ");
}

// Cập nhật profile (PUT /profile)
export async function updateProfile(
  userData: Partial<BaseUser>,
  roleData: Partial<ParentInfo | DoctorInfo>
): Promise<User> {
  const res = await apiClient.put<ApiResponse<User>>(API_ENDPOINTS.PROFILE.UPDATE, {
    user: userData,
    role: roleData,
  });
  if (res.data?.success && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data?.error || "Cập nhật hồ sơ thất bại");
}

// Thêm child cho parent (POST /profile/child)
export async function addChild(
  childData: Omit<ChildInfo, "child_id" | "parent_id">
): Promise<ChildInfo> {
  const res = await apiClient.post<ApiResponse<ChildInfo>>(API_ENDPOINTS.PROFILE.ADD_CHILD, childData);
  if (res.data?.success && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data?.error || "Thêm trẻ thất bại");
}

// Cập nhật child (PUT /profile/child/:child_id)
export async function updateChild(
  child_id: number,
  childData: Partial<ChildInfo>
): Promise<ChildInfo> {
  const res = await apiClient.put<ApiResponse<ChildInfo>>(API_ENDPOINTS.PROFILE.UPDATE_CHILD(child_id), childData);
  if (res.data?.success && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data?.error || "Cập nhật thông tin trẻ thất bại");
}

// Xóa child (DELETE /profile/child/:child_id)
export async function deleteChild(child_id: number): Promise<void> {
  const res = await apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.PROFILE.DELETE_CHILD(child_id));
  if (res.data?.success) return;
  throw new Error(res.data?.error || "Xóa trẻ thất bại");
}

// ===== AVATAR MANAGEMENT FUNCTIONS =====

// Upload avatar (POST /profile/avatar)
export async function uploadAvatar(file: File): Promise<AvatarUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post<ApiResponse<AvatarUploadResponse>>(
    API_ENDPOINTS.PROFILE.AVATAR_UPLOAD, 
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  if (res.data?.success && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data?.error || "Upload avatar thất bại");
}

// Update avatar (PUT /profile/avatar)
export async function updateAvatar(file: File): Promise<AvatarUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.put<ApiResponse<AvatarUploadResponse>>(
    API_ENDPOINTS.PROFILE.AVATAR_UPDATE, 
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  if (res.data?.success && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data?.error || "Cập nhật avatar thất bại");
}

// Delete avatar (DELETE /profile/avatar)
export async function deleteAvatar(): Promise<void> {
  const res = await apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.PROFILE.AVATAR_DELETE);
  
  if (res.data?.success) return;
  throw new Error(res.data?.error || "Xóa avatar thất bại");
}

// Helper function: Validate image file - Enhanced version
export function validateImageFile(file: File): FileValidationResult {
  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      error: 'Không có file được chọn'
    };
  }

  // Check file type by MIME type
  if (!AVATAR_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Chỉ hỗ trợ file ảnh: ${AVATAR_CONFIG.ALLOWED_TYPES.join(', ')}`
    };
  }

  // Check file extension as backup validation
  const fileName = file.name.toLowerCase();
  const hasValidExtension = AVATAR_CONFIG.ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      isValid: false,
      error: `Phần mở rộng file không hợp lệ. Chỉ hỗ trợ: ${AVATAR_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  // Check file size
  if (file.size > AVATAR_CONFIG.MAX_FILE_SIZE) {
    const maxSizeMB = AVATAR_CONFIG.MAX_FILE_SIZE / (1024 * 1024);
    return {
      isValid: false,
      error: `Kích thước file không được vượt quá ${maxSizeMB}MB`
    };
  }

  // Check if file size is reasonable (not too small)
  if (file.size < 1024) { // Less than 1KB
    return {
      isValid: false,
      error: 'File ảnh quá nhỏ, vui lòng chọn file ảnh hợp lệ'
    };
  }

  return { isValid: true };
}

// Helper function: Preview image before upload - Enhanced
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate file first
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      reject(new Error(validation.error || 'File không hợp lệ'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Không thể tạo preview ảnh'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Lỗi đọc file'));
    };
    
    reader.onabort = () => {
      reject(new Error('Đọc file bị hủy'));
    };
    
    reader.readAsDataURL(file);
  });
}

// Helper function: Get file info for debugging/logging
export function getFileInfo(file: File): Record<string, any> {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString(),
    sizeInMB: Math.round((file.size / (1024 * 1024)) * 100) / 100
  };
}

// Helper function: Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ===== ENHANCED AVATAR MANAGEMENT FUNCTIONS =====

// Upload avatar với validation được tăng cường (POST /profile/avatar)
export async function uploadAvatarWithValidation(file: File): Promise<AvatarUploadResponse> {
  // Validate file trước khi upload
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error || "File không hợp lệ");
  }

  return uploadAvatar(file);
}

// Update avatar với validation được tăng cường (PUT /profile/avatar)
export async function updateAvatarWithValidation(file: File): Promise<AvatarUploadResponse> {
  // Validate file trước khi upload
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error || "File không hợp lệ");
  }

  return updateAvatar(file);
}

// Batch avatar operations
export async function replaceAvatar(file: File): Promise<AvatarUploadResponse> {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error || "File không hợp lệ");
    }

    // Try update first (if avatar exists), fallback to upload
    try {
      return await updateAvatar(file);
    } catch (updateError) {
      // If update fails, try upload instead
      console.warn('Update failed, trying upload:', updateError);
      return await uploadAvatar(file);
    }
  } catch (error) {
    throw new Error(`Thay thế avatar thất bại: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ===== PROFILE VALIDATION FUNCTIONS =====

// Basic validation for user data before sending to backend
export function validateUserData(userData: Partial<BaseUser>): FileValidationResult {
  // Basic email validation if provided
  if (userData.email !== undefined && userData.email !== null) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return {
        isValid: false,
        error: 'Email không hợp lệ'
      };
    }
  }

  // Basic phone validation if provided
  if (userData.phone !== undefined && userData.phone !== null && userData.phone.length > 0) {
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(userData.phone)) {
      return {
        isValid: false,
        error: 'Số điện thoại không hợp lệ'
      };
    }
  }

  // Full name validation if provided
  if (userData.full_name !== undefined && userData.full_name !== null) {
    if (userData.full_name.trim().length < 2) {
      return {
        isValid: false,
        error: 'Họ tên phải có ít nhất 2 ký tự'
      };
    }
    if (userData.full_name.length > 100) {
      return {
        isValid: false,
        error: 'Họ tên không được vượt quá 100 ký tự'
      };
    }
  }

  return { isValid: true };
}

// ===== CHILD VALIDATION FUNCTIONS =====

// Validate child data before sending to backend
export function validateChildData(childData: Partial<ChildInfo>): FileValidationResult {
  // Check child name
  if (childData.name !== undefined && childData.name !== null) {
    if (childData.name.trim().length < 2) {
      return {
        isValid: false,
        error: 'Tên trẻ phải có ít nhất 2 ký tự'
      };
    }
    if (childData.name.length > 100) {
      return {
        isValid: false,
        error: 'Tên trẻ không được vượt quá 100 ký tự'
      };
    }
  }

  // Check birth date if provided
  if (childData.birth_date !== undefined && childData.birth_date !== null) {
    const birthDate = new Date(childData.birth_date);
    const today = new Date();
    
    if (birthDate > today) {
      return {
        isValid: false,
        error: 'Ngày sinh không thể trong tương lai'
      };
    }
    
    // Check if child is not too old (e.g., max 18 years)
    const maxAge = 18;
    const maxBirthDate = new Date();
    maxBirthDate.setFullYear(today.getFullYear() - maxAge);
    
    if (birthDate < maxBirthDate) {
      return {
        isValid: false,
        error: `Trẻ không được quá ${maxAge} tuổi`
      };
    }
  }

  // Check gender if provided
  if (childData.gender !== undefined && childData.gender !== null) {
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(childData.gender.toLowerCase())) {
      return {
        isValid: false,
        error: 'Giới tính không hợp lệ'
      };
    }
  }

  // Check weight if provided
  if (childData.weight !== undefined && childData.weight !== null) {
    if (childData.weight <= 0 || childData.weight > 200) {
      return {
        isValid: false,
        error: 'Cân nặng phải từ 0 đến 200kg'
      };
    }
  }

  // Check height if provided
  if (childData.height !== undefined && childData.height !== null) {
    if (childData.height <= 0 || childData.height > 250) {
      return {
        isValid: false,
        error: 'Chiều cao phải từ 0 đến 250cm'
      };
    }
  }

  return { isValid: true };
}

// Enhanced add child với validation
export async function addChildWithValidation(
  childData: Omit<ChildInfo, "child_id" | "parent_id">
): Promise<ChildInfo> {
  // Validate child data
  const validation = validateChildData(childData);
  if (!validation.isValid) {
    throw new Error(validation.error || "Dữ liệu trẻ không hợp lệ");
  }

  // Backend sẽ tự động lấy parent_id từ user_id trong JWT
  return addChild(childData);
}

// Enhanced update child với validation
export async function updateChildWithValidation(
  child_id: number,
  childData: Partial<ChildInfo>
): Promise<ChildInfo> {
  // Validate child data
  const validation = validateChildData(childData);
  if (!validation.isValid) {
    throw new Error(validation.error || "Dữ liệu trẻ không hợp lệ");
  }

  // Backend sẽ kiểm tra quyền sở hữu child thông qua user_id từ JWT
  return updateChild(child_id, childData);
}

// Safe delete child với confirmation
export async function safeDeleteChild(child_id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteChild(child_id);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Xóa trẻ thất bại'
    };
  }
}

// ===== ENHANCED PROFILE FUNCTIONS =====

// Enhanced update profile với validation - theo kiến trúc backend (sử dụng user_id từ JWT)
export async function updateProfileWithValidation(
  userData: Partial<BaseUser>,
  roleData: Partial<ParentInfo | DoctorInfo>
): Promise<User> {
  // Validate user data trước khi gửi lên backend
  const validation = validateUserData(userData);
  if (!validation.isValid) {
    throw new Error(validation.error || "Dữ liệu người dùng không hợp lệ");
  }

  // Backend sẽ tự động sử dụng user_id từ JWT token để xác định user cần update
  return updateProfile(userData, roleData);
}

// Safe update profile - với error handling tốt hơn
export async function safeUpdateProfile(
  userData: Partial<BaseUser>,
  roleData: Partial<ParentInfo | DoctorInfo>
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const user = await updateProfileWithValidation(userData, roleData);
    return {
      success: true,
      user
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cập nhật profile thất bại'
    };
  }
}

// ===== PROFILE UTILITY FUNCTIONS =====

// Get user role from profile data
export function getUserRole(profile: User): 'parent' | 'doctor' | 'admin' | 'guest' | 'unknown' {
  if (isParentUser(profile)) {
    return 'parent';
  }
  if (isDoctorUser(profile)) {
    return 'doctor';
  }
  if (isAdminUser(profile)) {
    return 'admin';
  }
  if (isGuestUser(profile)) {
    return 'guest';
  }
  return 'unknown';
}

// Check if user can manage children
export function canManageChildren(profile: User): boolean {
  return isParentUser(profile);
}

// Get children info for parent - backend sẽ trả về children data trong response
export function hasChildren(profile: User): boolean {
  if (isParentUser(profile)) {
    return (profile as ParentUser).children; // Type assertion
  }
  return false;
}

// Format user display name
export function formatUserDisplayName(user: User | BaseUser): string {
  if (user.full_name && user.full_name.trim().length > 0) {
    return user.full_name;
  }
  if (user.username && user.username.trim().length > 0) {
    return user.username;
  }
  if (user.email && user.email.trim().length > 0) {
    return user.email;
  }
  return 'Người dùng';
}

// Check if user profile is complete
export function isProfileComplete(user: User): boolean {
  const baseComplete = !!(user.full_name && user.email);
  
  if (isParentUser(user)) {
    return baseComplete && !!(user as ParentUser).parent_info;
  }
  
  if (isDoctorUser(user)) {
    const doctorUser = user as DoctorUser;
    return baseComplete && !!doctorUser.doctor_info && !!doctorUser.doctor_info.license_number;
  }
  
  return baseComplete;
}

// ===== BATCH OPERATIONS =====

// Batch update profile và children
export async function batchUpdateProfileAndChildren(
  userData: Partial<BaseUser>,
  roleData: Partial<ParentInfo | DoctorInfo>,
  childrenUpdates?: Array<{ child_id: number; data: Partial<ChildInfo> }>
): Promise<{ 
  profile: User; 
  children: ChildInfo[]; 
  errors: string[] 
}> {
  const errors: string[] = [];
  
  // Update profile first
  const profile = await updateProfileWithValidation(userData, roleData);
  
  // Update children if provided
  const updatedChildren: ChildInfo[] = [];
  if (childrenUpdates && childrenUpdates.length > 0) {
    for (const childUpdate of childrenUpdates) {
      try {
        const updatedChild = await updateChildWithValidation(childUpdate.child_id, childUpdate.data);
        updatedChildren.push(updatedChild);
      } catch (error) {
        errors.push(`Child ${childUpdate.child_id}: ${error instanceof Error ? error.message : 'Update failed'}`);
      }
    }
  }
  
  return {
    profile,
    children: updatedChildren,
    errors
  };
}