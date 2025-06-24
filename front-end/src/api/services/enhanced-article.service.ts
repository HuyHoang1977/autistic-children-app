import { articleService } from './article.sevice';
import { authService } from './auth.service';

export interface CreateArticleWithImageData {
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  tags?: string;
  status?: 'draft' | 'published';
  featured?: boolean;
  meta_description?: string;
  // Image file (optional)
  imageFile?: File;
}

export interface ArticleCreationProgress {
  step: 'validation' | 'image_upload' | 'article_creation' | 'completed';
  message: string;
  progress: number; // 0-100
  data?: any;
}

class EnhancedArticleService {
  private readonly BACKEND_URL = 'http://localhost:8000';

  /**
   * Upload image to MinIO storage
   */
  private async uploadImage(file: File): Promise<string> {
    console.log('📤 Starting image upload:', file.name);

    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('Chỉ được phép upload file ảnh');
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new Error('File ảnh không được vượt quá 5MB');
    }

    // Get auth token
    const token = authService.getToken();
    if (!token) {
      throw new Error('Không tìm thấy token đăng nhập');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket_type', 'articles');
    formData.append('folder', 'featured');

    // Upload to backend
    const response = await fetch(`${this.BACKEND_URL}/api/images/upload`, {
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
  }

  /**
   * Create article with automatic image upload
   */
  async createArticleWithImage(
    data: CreateArticleWithImageData,
    onProgress?: (progress: ArticleCreationProgress) => void
  ): Promise<any> {
    try {
      // Step 1: Validation
      onProgress?.({
        step: 'validation',
        message: 'Đang kiểm tra dữ liệu...',
        progress: 10
      });

      this.validateArticleData(data);

      let featuredImageUrl: string | undefined;

      // Step 2: Upload image (if provided)
      if (data.imageFile) {
        onProgress?.({
          step: 'image_upload',
          message: 'Đang upload ảnh lên MinIO...',
          progress: 30
        });

        featuredImageUrl = await this.uploadImage(data.imageFile);

        onProgress?.({
          step: 'image_upload',
          message: 'Upload ảnh thành công!',
          progress: 60
        });
      }

      // Step 3: Create article
      onProgress?.({
        step: 'article_creation',
        message: 'Đang tạo bài viết...',
        progress: 80
      });

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
      onProgress?.({
        step: 'completed',
        message: 'Tạo bài viết thành công!',
        progress: 100,
        data: createdArticle
      });

      return createdArticle;

    } catch (error: any) {
      console.error('❌ Create article with image failed:', error);
      throw error;
    }
  }

  /**
   * Update article with optional new image
   */
  async updateArticleWithImage(
    articleId: number,
    data: Partial<CreateArticleWithImageData>,
    onProgress?: (progress: ArticleCreationProgress) => void
  ): Promise<any> {
    try {
      onProgress?.({
        step: 'validation',
        message: 'Đang kiểm tra dữ liệu...',
        progress: 10
      });

      let featuredImageUrl: string | undefined;

      // Upload new image if provided
      if (data.imageFile) {
        onProgress?.({
          step: 'image_upload',
          message: 'Đang upload ảnh mới...',
          progress: 30
        });

        featuredImageUrl = await this.uploadImage(data.imageFile);

        onProgress?.({
          step: 'image_upload',
          message: 'Upload ảnh thành công!',
          progress: 60
        });
      }

      onProgress?.({
        step: 'article_creation',
        message: 'Đang cập nhật bài viết...',
        progress: 80
      });

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

      onProgress?.({
        step: 'completed',
        message: 'Cập nhật bài viết thành công!',
        progress: 100,
        data: updatedArticle
      });

      return updatedArticle;

    } catch (error: any) {
      console.error('❌ Update article with image failed:', error);
      throw error;
    }
  }

  /**
   * Delete image from MinIO
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Không tìm thấy token đăng nhập');
      }

      const response = await fetch(`${this.BACKEND_URL}/api/images/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ file_url: imageUrl })
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      console.log('✅ Image deleted successfully:', imageUrl);
    } catch (error: any) {
      console.error('❌ Delete image failed:', error);
      throw error;
    }
  }

  /**
   * Validate article data
   */
  private validateArticleData(data: CreateArticleWithImageData): void {
    if (!data.title?.trim()) {
      throw new Error('Tiêu đề là bắt buộc');
    }

    if (data.title.length < 10) {
      throw new Error('Tiêu đề phải có ít nhất 10 ký tự');
    }

    if (data.title.length > 255) {
      throw new Error('Tiêu đề không được vượt quá 255 ký tự');
    }

    if (!data.content?.trim()) {
      throw new Error('Nội dung bài viết là bắt buộc');
    }

    if (data.content.length < 100) {
      throw new Error('Nội dung bài viết phải có ít nhất 100 ký tự');
    }

    if (!data.category?.trim()) {
      throw new Error('Vui lòng chọn danh mục');
    }

    if (data.excerpt && data.excerpt.length > 500) {
      throw new Error('Mô tả ngắn không được vượt quá 500 ký tự');
    }

    if (data.meta_description && data.meta_description.length > 160) {
      throw new Error('Meta description không được vượt quá 160 ký tự');
    }
  }

  /**
   * Test image upload functionality
   */
  async testImageUpload(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/images/health`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🖼️ Image service health:', data);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Image service test failed:', error);
      return false;
    }
  }

  /**
   * Get image proxy URL (for CORS issues)
   */
  getProxyImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';

    // If it's already a full URL from MinIO, create proxy URL
    if (imageUrl.includes('localhost:9000') || imageUrl.includes('minio:9000')) {
      const pathPart = imageUrl.split('9000/')[1];
      if (pathPart) {
        return `${this.BACKEND_URL}/api/images/proxy/${pathPart}`;
      }
    }

    return imageUrl;
  }

  /**
   * Batch upload images (for multiple images in article content)
   */
  async uploadMultipleImages(
    files: File[],
    onProgress?: (uploaded: number, total: number) => void
  ): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const url = await this.uploadImage(files[i]);
        uploadedUrls.push(url);
        onProgress?.(i + 1, files.length);
      } catch (error) {
        console.error(`Failed to upload image ${i + 1}:`, error);
        throw error;
      }
    }

    return uploadedUrls;
  }
}

// Export singleton instance
export const enhancedArticleService = new EnhancedArticleService();