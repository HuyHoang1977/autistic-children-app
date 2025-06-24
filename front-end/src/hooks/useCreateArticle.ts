// hooks/useCreateArticle.ts - Hook quản lý tạo bài viết
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// ✅ Import existing articleService instead of enhanced service for now
import { articleService } from '../api/services/article.sevice';

export interface CreateArticleWithImageData {
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  tags?: string;
  status?: 'draft' | 'published';
  featured?: boolean;
  meta_description?: string;
  imageFile?: File;
}

export interface ArticleCreationProgress {
  step: 'validation' | 'image_upload' | 'article_creation' | 'completed';
  message: string;
  progress: number; // 0-100
  data?: any;
}

interface UseCreateArticleReturn {
  // States
  isCreating: boolean;
  progress: ArticleCreationProgress | null;
  error: string | null;

  // Actions
  createArticle: (data: CreateArticleWithImageData) => Promise<void>;
  updateArticle: (articleId: number, data: Partial<CreateArticleWithImageData>) => Promise<void>;
  reset: () => void;

  // Utils
  testImageService: () => Promise<boolean>;
}

export const useCreateArticle = (): UseCreateArticleReturn => {
  const navigate = useNavigate();

  // States
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState<ArticleCreationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Backend URL
  const BACKEND_URL = 'http://localhost:8000';

  // Get auth token
  const getAuthToken = (): string | null => {
    return (
      localStorage.getItem('auth_token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('auth_token') ||
      sessionStorage.getItem('access_token') ||
      sessionStorage.getItem('token')
    );
  };

  // Upload image to MinIO
  const uploadImage = async (file: File): Promise<string> => {
    console.log('📤 Starting image upload:', file.name);

    // Get auth token
    const token = getAuthToken();
    if (!token) {
      throw new Error('Không tìm thấy token đăng nhập');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket_type', 'articles');
    formData.append('folder', 'featured');

    // Upload to backend
    const response = await fetch(`${BACKEND_URL}/api/images/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      } else if (response.status === 413) {
        throw new Error('File quá lớn');
      } else {
        throw new Error(`Upload failed: ${response.status}`);
      }
    }

    const result = await response.json();

    if (!result.success || !result.file_url) {
      throw new Error(result.error || 'Upload thất bại');
    }

    console.log('✅ Image uploaded successfully:', result.file_url);
    return result.file_url;
  };

  // Reset state
  const reset = useCallback(() => {
    setIsCreating(false);
    setProgress(null);
    setError(null);
  }, []);

  // Update progress
  const updateProgress = useCallback((step: ArticleCreationProgress['step'], message: string, progressValue: number, data?: any) => {
    setProgress({
      step,
      message,
      progress: progressValue,
      data
    });
  }, []);

  // Create article with image
  const createArticle = useCallback(async (data: CreateArticleWithImageData) => {
    setIsCreating(true);
    setError(null);
    setProgress(null);

    try {
      console.log('🚀 Starting article creation process...');

      // Step 1: Validation
      updateProgress('validation', 'Đang kiểm tra dữ liệu...', 10);

      // Validate data
      if (!data.title?.trim()) {
        throw new Error('Tiêu đề là bắt buộc');
      }
      if (!data.content?.trim()) {
        throw new Error('Nội dung bài viết là bắt buộc');
      }
      if (!data.category?.trim()) {
        throw new Error('Vui lòng chọn danh mục');
      }

      let featuredImageUrl: string | undefined;

      // Step 2: Upload image (if provided)
      if (data.imageFile) {
        updateProgress('image_upload', 'Đang upload ảnh lên MinIO...', 30);

        featuredImageUrl = await uploadImage(data.imageFile);

        updateProgress('image_upload', 'Upload ảnh thành công!', 60);
        toast.success('Upload ảnh thành công!');
      }

      // Step 3: Create article
      updateProgress('article_creation', 'Đang tạo bài viết...', 80);

      const articleData = {
        title: data.title.trim(),
        content: data.content.trim(),
        excerpt: data.excerpt?.trim(),
        category: data.category,
        tags: data.tags?.trim(),
        status: data.status || 'draft',
        featured: data.featured || false,
        featured_image: featuredImageUrl,
        meta_description: data.meta_description?.trim()
      };

      const createdArticle = await articleService.createArticle(articleData);

      // Step 4: Completed
      updateProgress('completed', 'Tạo bài viết thành công!', 100, createdArticle);

      console.log('✅ Article created successfully:', createdArticle);
      toast.success('Tạo bài viết thành công!');

      // Navigate to the created article
      setTimeout(() => {
        navigate(`/articles/${createdArticle.article_id}`);
      }, 1000);

    } catch (err: any) {
      console.error('❌ Article creation failed:', err);

      const errorMessage = err.message || 'Có lỗi xảy ra khi tạo bài viết';
      setError(errorMessage);
      toast.error(errorMessage);

      // Handle specific errors
      if (err.message.includes('Authentication') || err.message.includes('token')) {
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } finally {
      setIsCreating(false);
    }
  }, [navigate, updateProgress]);

  // Update article (placeholder for now)
  const updateArticle = useCallback(async (
    articleId: number,
    data: Partial<CreateArticleWithImageData>
  ) => {
    setIsCreating(true);
    setError(null);
    setProgress(null);

    try {
      console.log('🔄 Starting article update process...');

      updateProgress('validation', 'Đang kiểm tra dữ liệu...', 10);

      let featuredImageUrl: string | undefined;

      // Upload new image if provided
      if (data.imageFile) {
        updateProgress('image_upload', 'Đang upload ảnh mới...', 30);
        featuredImageUrl = await uploadImage(data.imageFile);
        updateProgress('image_upload', 'Upload ảnh thành công!', 60);
      }

      updateProgress('article_creation', 'Đang cập nhật bài viết...', 80);

      const updateData: any = {};

      if (data.title) updateData.title = data.title.trim();
      if (data.content) updateData.content = data.content.trim();
      if (data.excerpt !== undefined) updateData.excerpt = data.excerpt?.trim();
      if (data.category) updateData.category = data.category;
      if (data.tags !== undefined) updateData.tags = data.tags?.trim();
      if (data.status) updateData.status = data.status;
      if (data.featured !== undefined) updateData.featured = data.featured;
      if (data.meta_description !== undefined) updateData.meta_description = data.meta_description?.trim();
      if (featuredImageUrl) updateData.featured_image = featuredImageUrl;

      const updatedArticle = await articleService.updateArticle(articleId, updateData);

      updateProgress('completed', 'Cập nhật bài viết thành công!', 100, updatedArticle);

      console.log('✅ Article updated successfully:', updatedArticle);
      toast.success('Cập nhật bài viết thành công!');

      // Navigate to the updated article
      setTimeout(() => {
        navigate(`/articles/${articleId}`);
      }, 1000);

    } catch (err: any) {
      console.error('❌ Article update failed:', err);

      const errorMessage = err.message || 'Có lỗi xảy ra khi cập nhật bài viết';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, [navigate, updateProgress]);

  // Test image service
  const testImageService = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔍 Testing backend connection...');

      // Test main health endpoint
      const healthResponse = await fetch(`${BACKEND_URL}/`);
      if (healthResponse.ok) {
        console.log('✅ Backend health check passed');
        toast.success('Backend connection OK');

        // Test image endpoint
        const token = getAuthToken();
        if (token) {
          const imageResponse = await fetch(`${BACKEND_URL}/api/images/health`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            console.log('🖼️ Images endpoint:', imageData);
            toast.success('Images endpoint OK');
            return true;
          } else {
            toast.warning(`Images endpoint status: ${imageResponse.status}`);
            return false;
          }
        } else {
          toast.warning('Không có token để test images endpoint');
          return false;
        }
      } else {
        throw new Error(`Backend health check failed: ${healthResponse.status}`);
      }

    } catch (error) {
      console.error('❌ Backend test failed:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Không thể kết nối backend trên http://localhost:8000');
      } else {
        toast.error('Backend connection error');
      }
      return false;
    }
  }, []);

  return {
    // States
    isCreating,
    progress,
    error,

    // Actions
    createArticle,
    updateArticle,
    reset,

    // Utils
    testImageService
  };
};