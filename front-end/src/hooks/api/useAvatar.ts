// hooks/useAvatar.ts - Custom hook for avatar management
import { useState, useCallback } from 'react';
import { 
  uploadAvatar, 
  updateAvatar, 
  deleteAvatar, 
  validateImageFile, 
  createImagePreview 
} from '../../api/services/profile.service';

interface UseAvatarReturn {
  // States
  isUploading: boolean;
  uploadProgress: number;
  previewUrl: string | null;
  error: string | null;

  // Actions
  handleFileSelect: (file: File) => Promise<void>;
  uploadSelectedFile: () => Promise<string | null>;
  updateSelectedFile: () => Promise<string | null>;
  handleDeleteAvatar: () => Promise<void>;
  clearPreview: () => void;
  clearError: () => void;

  // Data
  selectedFile: File | null;
}

export function useAvatar(onAvatarChange?: () => void): UseAvatarReturn {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection và tạo preview
  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'File không hợp lệ');
      return;
    }

    try {
      // Tạo preview
      const preview = await createImagePreview(file);
      setSelectedFile(file);
      setPreviewUrl(preview);
    } catch (err) {
      setError('Không thể tạo preview ảnh');
      console.error('Preview error:', err);
    }
  }, []);

  // Upload avatar mới
  const uploadSelectedFile = useCallback(async (): Promise<string | null> => {
    if (!selectedFile) {
      setError('Chưa chọn file');
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (vì FormData upload không có built-in progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await uploadAvatar(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Clear states
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsUploading(false);
      setUploadProgress(0);

      // Trigger callback to refresh user data
      if (onAvatarChange) {
        onAvatarChange();
      }

      return result.avatar_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload thất bại');
      setIsUploading(false);
      setUploadProgress(0);
      return null;
    }
  }, [selectedFile, onAvatarChange]);

  // Update avatar hiện tại
  const updateSelectedFile = useCallback(async (): Promise<string | null> => {
    if (!selectedFile) {
      setError('Chưa chọn file');
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await updateAvatar(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Clear states
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsUploading(false);
      setUploadProgress(0);

      // Trigger callback to refresh user data
      if (onAvatarChange) {
        onAvatarChange();
      }

      return result.avatar_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật thất bại');
      setIsUploading(false);
      setUploadProgress(0);
      return null;
    }
  }, [selectedFile, onAvatarChange]);

  // Xóa avatar
  const handleDeleteAvatar = useCallback(async (): Promise<void> => {
    setIsUploading(true);

    try {
      await deleteAvatar();
      
      // Trigger callback to refresh user data
      if (onAvatarChange) {
        onAvatarChange();
      }
      
      setIsUploading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xóa avatar thất bại');
      setIsUploading(false);
    }
  }, [onAvatarChange]);

  // Clear preview
  const clearPreview = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // States
    isUploading,
    uploadProgress,
    previewUrl,
    error,
    selectedFile,

    // Actions
    handleFileSelect,
    uploadSelectedFile,
    updateSelectedFile,
    handleDeleteAvatar,
    clearPreview,
    clearError,
  };
}
