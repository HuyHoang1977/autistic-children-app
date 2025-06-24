import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Save,
  Send,
  Eye,
  AlertCircle
} from "lucide-react";
import { articleService } from "../api/services/article.sevice";
import { uploadService } from "../api/services/upload.service";
import { toast } from "sonner";

interface CreateArticleData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string;
  featured_image_url?: string;
  status: 'draft' | 'published';
}

const CreateArticlePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CreateArticleData>({
    title: "",
    content: "",
    excerpt: "",
    category: "",
    tags: "",
    status: 'draft'
  });

  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadedImageId, setUploadedImageId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Categories
  const categories = [
    "Sức khỏe trẻ em",
    "Dinh dưỡng",
    "Phát triển tâm lý",
    "Bệnh lý thường gặp",
    "Chăm sóc sơ sinh",
    "Giáo dục sức khỏe",
    "Khác"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category: value
    }));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Upload using the flow: presigned URL → MinIO → confirm
      const result = await uploadService.uploadImage(file);

      setFormData(prev => ({
        ...prev,
        featured_image_url: result.image_url
      }));

      setUploadedImageId(result.image_id);
      toast.success('Upload ảnh thành công!');

    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Upload ảnh thất bại');
      setImagePreview("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (uploadedImageId) {
      try {
        await uploadService.deleteImage(uploadedImageId);
        toast.success('Đã xóa ảnh');
      } catch (error) {
        console.error('Delete image failed:', error);
      }
    }

    setImagePreview("");
    setUploadedImageId("");
    setFormData(prev => ({
      ...prev,
      featured_image_url: undefined
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.title.trim()) {
      errors.push("Tiêu đề là bắt buộc");
    }

    if (!formData.content.trim()) {
      errors.push("Nội dung là bắt buộc");
    }

    if (!formData.category) {
      errors.push("Vui lòng chọn danh mục");
    }

    if (formData.title.length > 255) {
      errors.push("Tiêu đề không được vượt quá 255 ký tự");
    }

    if (formData.excerpt.length > 500) {
      errors.push("Mô tả ngắn không được vượt quá 500 ký tự");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published' = 'draft') => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);

    // Update status
    const submitData = {
      ...formData,
      status
    };

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const article = await articleService.createArticle(submitData);

      toast.success(
        status === 'published'
          ? 'Bài viết đã được xuất bản!'
          : 'Bài viết đã được lưu nháp!'
      );

      navigate(`/articles/${article.article_id}`);

    } catch (error: any) {
      console.error('Create article failed:', error);
      const errorMessage = error.message || 'Có lỗi xảy ra khi tạo bài viết';
      setErrors([errorMessage]);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    // Open preview in new tab/modal
    const previewData = {
      ...formData,
      content: formData.content,
      featured_image_url: imagePreview || formData.featured_image_url
    };

    // You can implement modal preview or navigate to preview page
    console.log('Preview:', previewData);
    toast.info('Tính năng xem trước đang được phát triển');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Tạo bài viết mới
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={(e) => handleSubmit(e, 'draft')} className="space-y-6">
              {/* Error Display */}
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề bài viết *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Nhập tiêu đề bài viết..."
                  className="text-lg"
                  maxLength={255}
                />
                <div className="text-sm text-gray-500">
                  {formData.title.length}/255 ký tự
                </div>
              </div>

              {/* Category and Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Danh mục *</Label>
                  <Select onValueChange={handleCategoryChange} value={formData.category}>
                    <SelectTrigger>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="VD: dinh dưỡng, trẻ em, sức khỏe"
                  />
                  <div className="text-sm text-gray-500">
                    Phân cách bằng dấu phẩy
                  </div>
                </div>
              </div>

              {/* Featured Image */}
              <div className="space-y-2">
                <Label>Ảnh đại diện</Label>

                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                      <p className="text-gray-600">
                        {isUploading ? "Đang upload..." : "Nhấn để chọn ảnh"}
                      </p>
                      <p className="text-sm text-gray-500">
                        JPG, PNG, GIF. Tối đa 5MB
                      </p>
                    </div>
                    {isUploading && (
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600 mt-2" />
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <Label htmlFor="excerpt">Mô tả ngắn</Label>
                <Textarea
                  id="excerpt"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="Mô tả ngắn gọn về nội dung bài viết..."
                  rows={3}
                  maxLength={500}
                />
                <div className="text-sm text-gray-500">
                  {formData.excerpt.length}/500 ký tự
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Nội dung bài viết *</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Viết nội dung bài viết của bạn..."
                  rows={15}
                  className="min-h-[400px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Xem trước
                </Button>

                <Button
                  type="submit"
                  variant="outline"
                  disabled={isSubmitting || isUploading}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Lưu nháp
                </Button>

                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'published')}
                  disabled={isSubmitting || isUploading}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Xuất bản
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateArticlePage;