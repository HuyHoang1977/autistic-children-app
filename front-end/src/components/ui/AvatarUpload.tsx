// components/Avatar/AvatarUpload.tsx - Avatar upload component
import React, { useRef } from 'react';
import { useAvatar } from '../../hooks/api/useAvatar';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onAvatarChange?: () => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const sizeClasses = {
  small: 'w-16 h-16',
  medium: 'w-24 h-24', 
  large: 'w-32 h-32'
};

export function AvatarUpload({ 
  currentAvatarUrl, 
  onAvatarChange,
  size = 'medium',
  className = ''
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isUploading,
    uploadProgress,
    previewUrl,
    error,
    selectedFile,
    handleFileSelect,
    uploadSelectedFile,
    updateSelectedFile,
    handleDeleteAvatar,
    clearPreview,
    clearError
  } = useAvatar(onAvatarChange);

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleConfirmUpload = async () => {
    if (selectedFile) {
      // Sử dụng smart logic từ profile.service - tự động xác định upload/update
      await uploadSelectedFile(); // Hook sẽ sử dụng replaceAvatar internally
    }
  };

  const handleCancelUpload = () => {
    clearPreview();
  };

  const handleDeleteClick = async () => {
    if (window.confirm('Bạn có chắc muốn xóa avatar không?')) {
      await handleDeleteAvatar();
    }
  };

  const displayImage = previewUrl || currentAvatarUrl;

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Avatar Display */}
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-200`}>
        {displayImage ? (
          <img 
            src={displayImage} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <svg className="w-1/2 h-1/2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-sm">
              {uploadProgress}%
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="text-red-500 text-sm text-center">
          {error}
          <button 
            onClick={clearError}
            className="ml-2 text-red-700 hover:text-red-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {!selectedFile && !isUploading && (
          <>
            <button
              onClick={handleUploadClick}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {currentAvatarUrl ? 'Thay đổi avatar' : 'Tải lên avatar'}
            </button>
            
            {currentAvatarUrl && (
              <button
                onClick={handleDeleteClick}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Xóa avatar
              </button>
            )}
          </>
        )}

        {selectedFile && !isUploading && (
          <>
            <button
              onClick={handleConfirmUpload}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Xác nhận
            </button>
            <button
              onClick={handleCancelUpload}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Hủy
            </button>
          </>
        )}

        {isUploading && (
          <div className="px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed">
            Đang tải lên...
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}

// Simple Avatar Display Component
interface AvatarDisplayProps {
  avatarUrl?: string | null;
  name?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function AvatarDisplay({ 
  avatarUrl, 
  name, 
  size = 'medium',
  className = ''
}: AvatarDisplayProps) {
  const initials = name 
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-200 ${className}`}>
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={name || 'Avatar'} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
          {initials}
        </div>
      )}
    </div>
  );
}
