import React, { useState, useRef, useCallback } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Card, CardContent } from "../../ui/card";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Check
} from "lucide-react";
import { uploadService } from "../../../api/services/upload.service";
import { toast } from "sonner";

interface ImageUploadProps {
  onImageUpload: (imageUrl: string, imageId: string) => void;
  onImageRemove?: (imageId: string) => void;
  maxFileSize?: number; // MB
  acceptedTypes?: string[];
  currentImage?: string;
  disabled?: boolean;
  className?: string;
}

interface UploadedImageData {
  url: string;
  id: string;
  file: File;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  onImageRemove,
  maxFileSize = 5, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  currentImage,
  disabled = false,
  className = ""
}) => {
  const [uploadedImage, setUploadedImage] = useState<UploadedImageData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Chỉ hỗ trợ các định dạng: ${acceptedTypes.map(type => type.split('/')[1]).join(', ')}`;
    }

    if (file.size > maxFileSize * 1024 * 1024) {
      return `Kích thước file không được vượt quá ${maxFileSize}MB`;
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploading(true);
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    try {
      const result = await uploadService.uploadImage(file);

      const imageData: UploadedImageData = {
        url: result.image_url,
        id: result.image_id,
        file
      };

      setUploadedImage(imageData);
      onImageUpload(result.image_url, result.image_id);

      toast.success('Upload hình ảnh thành công!');
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Upload thất bại, vui lòng thử lại');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  }, [maxFileSize, acceptedTypes, onImageUpload]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect, disabled]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Remove image
  const handleRemoveImage = useCallback(() => {
    if (uploadedImage) {
      onImageRemove?.(uploadedImage.id);
    }

    setUploadedImage(null);
    setPreviewUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    toast.success('Đã xóa hình ảnh');
  }, [uploadedImage, onImageRemove]);

  // Open file dialog
  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Label htmlFor="image-upload" className="text-sm font-medium">
        Hình ảnh đại diện
      </Label>

      {/* Upload Area */}
      {!previewUrl ? (
        <Card
          className={`
            border-2 border-dashed transition-all duration-200 cursor-pointer
            ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-blue-50'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <CardContent className="p-8">
            <div className="text-center">
              {isUploading ? (
                <div className="space-y-3">
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-500" />
                  <p className="text-sm text-gray-600">Đang upload...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Upload className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Kéo thả hình ảnh vào đây hoặc{' '}
                      <span className="text-blue-600">chọn file</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {acceptedTypes.map(type => type.split('/')[1]).join(', ')} - Tối đa {maxFileSize}MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Preview Area */
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover"
              />

              {/* Upload Status Overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
                    <p className="text-sm">Đang upload...</p>
                  </div>
                </div>
              )}

              {/* Success Indicator */}
              {uploadedImage && !isUploading && (
                <div className="absolute top-3 left-3 bg-green-500 text-white p-1 rounded-full">
                  <Check className="h-4 w-4" />
                </div>
              )}

              {/* Remove Button */}
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-3 right-3"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Image Info */}
            <div className="p-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {uploadedImage?.file.name || 'Hình ảnh đã chọn'}
                  </span>
                </div>
                {uploadedImage && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Đã upload
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
        id="image-upload"
      />

      {/* Upload Guidelines */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 <strong>Gợi ý:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Sử dụng hình ảnh có độ phân giải cao để có chất lượng tốt nhất</li>
          <li>Tỉ lệ khung hình 16:9 hoặc 4:3 sẽ hiển thị đẹp nhất</li>
          <li>Hình ảnh nên liên quan đến nội dung bài viết</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageUpload;