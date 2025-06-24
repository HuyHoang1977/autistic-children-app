// CreateArticlePage.tsx - UPDATED VERSION với enhanced service
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Progress } from '../../components/ui/progress';
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  X,
  Eye,
  Save,
  Loader2,
  FileText,
  Tag,
  User,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/auth/useAuth';
import { useCreateArticle } from '../../hooks/useCreateArticle';
import { toast } from 'sonner';

interface ArticleFormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string;
  featured: boolean;
  meta_description: string;
}

const CreateArticlePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Sử dụng hook mới
  const {
    isCreating,
    progress,
    error,
    createArticle,
    reset,
    testImageService
  } = useCreateArticle();

  // Form state
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: '',
    featured: false,
    meta_description: ''
  });

  // UI state
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Categories
  const categories = [
    'Sức khỏe trẻ em',
    'Dinh dưỡng',
    'Phát triển tâm lý',
    'Bệnh lý thường gặp',
    'Chăm sóc sơ sinh',
    'Giáo dục sức khỏe',
    'Vận động và thể thao',
    'An toàn trẻ em'
  ];

  // Handle form input changes
  const handleInputChange = (field: keyof ArticleFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // ✅ Handle image selection (chỉ preview, chưa upload)
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ được phép chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('File ảnh không được vượt quá 5MB');
      return;
    }

    // Set selected image và preview
    setSelectedImage(file);

    // Tạo preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    console.log('📎 Image selected:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề là bắt buộc';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Tiêu đề phải có ít nhất 10 ký tự';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Tiêu đề không được vượt quá 255 ký tự';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Nội dung bài viết là bắt buộc';
    } else if (formData.content.length < 100) {
      newErrors.content = 'Nội dung bài viết phải có ít nhất 100 ký tự';
    }

    if (!formData.category) {
      newErrors.category = 'Vui lòng chọn danh mục';
    }

    if (formData.excerpt && formData.excerpt.length > 500) {
      newErrors.excerpt = 'Mô tả ngắn không được vượt quá 500 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle form submission với enhanced service
  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    if (!user) {
      toast.error('Vui lòng đăng nhập để tạo bài viết');
      return;
    }

    try {
      console.log('🚀 Submitting article with status:', status);

      // Chuẩn bị dữ liệu
      const articleData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim() || undefined,
        category: formData.category,
        tags: formData.tags.trim() || undefined,
        status,
        featured: formData.featured,
        meta_description: formData.meta_description?.trim() || undefined,
        imageFile: selectedImage || undefined // File sẽ được upload trong service
      };

      console.log('📋 Article data prepared:', {
        ...articleData,
        imageFile: selectedImage ? `${selectedImage.name} (${selectedImage.size} bytes)` : 'none'
      });

      // Gọi enhanced service
      await createArticle(articleData);

    } catch (error: any) {
      console.error('❌ Submit error:', error);
      // Error đã được handle trong hook
    }
  };

  // Generate excerpt from content
  const generateExcerpt = () => {
    if (formData.content) {
      const excerpt = formData.content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .substring(0, 200);

      setFormData(prev => ({
        ...prev,
        excerpt: excerpt + (formData.content.length > 200 ? '...' : '')
      }));
    }
  };

  // Get current step message
  const getCurrentStepMessage = (): string => {
    if (!progress) return '';

    switch (progress.step) {
      case 'validation':
        return 'Đang kiểm tra dữ liệu...';
      case 'image_upload':
        return selectedImage ? 'Đang upload ảnh lên MinIO...' : 'Đang chuẩn bị...';
      case 'article_creation':
        return 'Đang lưu bài viết vào database...';
      case 'completed':
        return 'Hoàn thành! Đang chuyển hướng...';
      default:
        return progress.message;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/articles')}
              className="flex items-center gap-2"
              disabled={isCreating}
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tạo bài viết mới
              </h1>
              <p className="text-gray-600 mt-1">
                Chia sẻ kiến thức y tế với cộng đồng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2"
              disabled={isCreating}
            >
              <Eye className="h-4 w-4" />
              {previewMode ? 'Chỉnh sửa' : 'Xem trước'}
            </Button>

            {/* Debug button */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outline"
                onClick={testImageService}
                size="sm"
                className="text-xs"
                disabled={isCreating}
              >
                🔧 Test Service
              </Button>
            )}
          </div>
        </div>

        {/* ✅ Progress Bar - hiển thị khi đang tạo bài viết */}
        {isCreating && progress && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Đang tạo bài viết...</h3>
                  <span className="text-sm text-gray-500">{progress.progress}%</span>
                </div>

                <Progress value={progress.progress} className="w-full" />

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {getCurrentStepMessage()}
                </div>

                {/* Step indicators */}
                <div className="flex items-center gap-4 text-xs">
                  <div className={`flex items-center gap-1 ${
                    progress.step === 'validation' ? 'text-blue-600' : 
                    progress.progress > 10 ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <CheckCircle className="h-3 w-3" />
                    Kiểm tra
                  </div>

                  {selectedImage && (
                    <div className={`flex items-center gap-1 ${
                      progress.step === 'image_upload' ? 'text-blue-600' : 
                      progress.progress > 60 ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      <CheckCircle className="h-3 w-3" />
                      Upload ảnh
                    </div>
                  )}

                  <div className={`flex items-center gap-1 ${
                    progress.step === 'article_creation' ? 'text-blue-600' : 
                    progress.progress > 80 ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <CheckCircle className="h-3 w-3" />
                    Lưu bài viết
                  </div>

                  <div className={`flex items-center gap-1 ${
                    progress.step === 'completed' ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <CheckCircle className="h-3 w-3" />
                    Hoàn thành
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Có lỗi xảy ra:</span>
              </div>
              <p className="text-red-600 mt-2">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="mt-3"
              >
                Thử lại
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {!previewMode ? (
              <>
                {/* Title & Excerpt */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tiêu đề bài viết *
                      </label>
                      <Input
                        placeholder="Nhập tiêu đề bài viết (ít nhất 10 ký tự)..."
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className={errors.title ? 'border-red-500' : ''}
                        disabled={isCreating}
                      />
                      {errors.title && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.title}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.title.length}/255 ký tự
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Mô tả ngắn
                      </label>
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Nhập mô tả ngắn cho bài viết..."
                          value={formData.excerpt}
                          onChange={(e) => handleInputChange('excerpt', e.target.value)}
                          rows={3}
                          className={`flex-1 ${errors.excerpt ? 'border-red-500' : ''}`}
                          disabled={isCreating}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateExcerpt}
                          className="self-start"
                          disabled={!formData.content || isCreating}
                        >
                          Tự động
                        </Button>
                      </div>
                      {errors.excerpt && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.excerpt}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.excerpt.length}/500 ký tự
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* ✅ Featured Image - chỉ select, chưa upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Ảnh đại diện
                      {selectedImage && (
                        <Badge variant="secondary" className="ml-2">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Đã chọn
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2"
                          disabled={isCreating}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-2 left-2">
                          <Badge className="bg-blue-500">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            {selectedImage?.name}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => !isCreating && fileInputRef.current?.click()}
                        className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors ${
                          isCreating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-gray-400" />
                          <p className="text-gray-600">
                            Click để chọn ảnh đại diện
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF tối đa 5MB
                          </p>
                          <p className="text-xs text-blue-600">
                            Ảnh sẽ được upload khi tạo bài viết
                          </p>
                        </div>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isCreating}
                    />
                  </CardContent>
                </Card>

                {/* Content */}
                <Card>
                  <CardHeader>
                    <CardTitle>Nội dung bài viết *</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Viết nội dung bài viết tại đây (ít nhất 100 ký tự)..."
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      rows={15}
                      className={errors.content ? 'border-red-500' : ''}
                      disabled={isCreating}
                    />
                    {errors.content && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.content}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {formData.content.length} ký tự
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Preview Mode */
              <Card>
                <CardContent className="p-8">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt={formData.title}
                      className="w-full h-64 object-cover rounded-lg mb-6"
                    />
                  )}

                  <div className="space-y-4">
                    <div>
                      {formData.category && (
                        <Badge variant="secondary" className="mb-3">
                          {formData.category}
                        </Badge>
                      )}
                      <h1 className="text-3xl font-bold text-gray-900">
                        {formData.title || 'Tiêu đề bài viết'}
                      </h1>
                    </div>

                    {formData.excerpt && (
                      <p className="text-lg text-gray-600 italic border-l-4 border-blue-500 pl-4">
                        {formData.excerpt}
                      </p>
                    )}

                    <div className="prose prose-lg max-w-none">
                      <div className="whitespace-pre-wrap">
                        {formData.content || 'Nội dung bài viết sẽ hiển thị ở đây...'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Hành động
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => handleSubmit('draft')}
                  disabled={isCreating}
                  variant="outline"
                  className="w-full"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Lưu nháp
                </Button>

                <Button
                  onClick={() => handleSubmit('published')}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Đăng bài
                </Button>

                {isCreating && (
                  <p className="text-xs text-gray-500 text-center">
                    Đang xử lý... Vui lòng không tắt trang
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Categories & Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Phân loại
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Danh mục *
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                    disabled={isCreating}
                  >
                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tags
                  </label>
                  <Input
                    placeholder="vd: dinh dưỡng, trẻ em, sức khỏe"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    disabled={isCreating}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Phân cách bằng dấu phẩy
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Author Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin tác giả
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-medium">{user?.full_name}</p>
                    <p className="text-sm text-gray-500">{user?.username}</p>
                    {user?.role_id === 2 && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Bác sĩ
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle>SEO & Meta</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Meta Description
                  </label>
                  <Textarea
                    placeholder="Mô tả ngắn cho SEO..."
                    value={formData.meta_description}
                    onChange={(e) => handleInputChange('meta_description', e.target.value)}
                    rows={3}
                    disabled={isCreating}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.meta_description?.length || 0}/160 ký tự
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Upload Status */}
            {selectedImage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <ImageIcon className="h-5 w-5" />
                    Ảnh đã chọn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>File: {selectedImage.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Kích thước: {(selectedImage.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span>Sẽ upload khi tạo bài viết</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateArticlePage;