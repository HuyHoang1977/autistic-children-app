// src/components/ui/ImageUploader.tsx - SIMPLE VERSION (No Complex TypeScript)
import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string | null) => void;
  bucketType?: string;
  folder?: string;
  className?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  placeholder?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  bucketType = 'articles',
  folder = 'featured',
  className = '',
  maxSizeMB = 5,
  disabled = false,
  placeholder = 'Click to upload image'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(value || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Only image files are allowed' };
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
    }

    return { valid: true };
  };

  const handleFileSelect = async (file: File) => {
    try {
      setUploadError(null);

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid file');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewUrl(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      setIsUploading(true);

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket_type', bucketType);
      formData.append('folder', folder);

      // Upload
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust token retrieval as needed
        }
      });

      const result = await response.json();

      if (result.success) {
        setPreviewUrl(result.file_url);
        onChange(result.file_url);
        console.log('✅ Upload successful:', result.file_url);
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Upload failed';
      setUploadError(errorMessage);
      setPreviewUrl(value || '');
      console.error('❌ Upload error:', error);
    } finally {
      setIsUploading(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = async () => {
    if (value && value.startsWith('http')) {
      try {
        const response = await fetch('/api/images/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ file_url: value })
        });

        if (response.ok) {
          console.log('✅ Image deleted from server');
        }
      } catch (error) {
        console.error('❌ Delete error:', error);
      }
    }

    setPreviewUrl('');
    onChange(null);
    setUploadError(null);
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {!previewUrl ? (
        <div
          onClick={handleClick}
          className={`
            border-2 border-dashed border-gray-300 rounded-lg p-8 text-center
            transition-colors cursor-pointer hover:border-blue-500 hover:bg-blue-50
            ${disabled || isUploading ? 'cursor-not-allowed opacity-50' : ''}
            ${uploadError ? 'border-red-300 bg-red-50' : ''}
          `}
        >
          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            ) : uploadError ? (
              <AlertCircle className="h-12 w-12 text-red-500" />
            ) : (
              <Upload className="h-12 w-12 text-gray-400" />
            )}

            <div>
              <p className="text-lg font-medium text-gray-900">
                {isUploading ? 'Uploading...' : uploadError ? 'Upload Failed' : placeholder}
              </p>

              {!isUploading && !uploadError && (
                <p className="text-sm text-gray-500 mt-1">
                  PNG, JPG, GIF up to {maxSizeMB}MB
                </p>
              )}

              {uploadError && (
                <p className="text-sm text-red-600 mt-1">
                  {uploadError}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Preview Area */
        <div className="relative">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-64 object-cover rounded-lg"
          />

          {!disabled && !isUploading && (
            <>
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>

              <button
                onClick={handleClick}
                className="absolute bottom-2 left-2 bg-gray-500 text-white px-3 py-2 rounded flex items-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Change
              </button>
            </>
          )}

          {value && value.startsWith('http') && (
            <div className="absolute top-2 left-2">
              <div className="bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Uploaded
              </div>
            </div>
          )}
        </div>
      )}

      {/* Retry Button */}
      {uploadError && (
        <div className="text-center">
          <button
            onClick={() => {
              setUploadError(null);
              handleClick();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
};

export default ImageUploader;