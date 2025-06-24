import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import {
  Save,
  Eye,
  Send,
  Loader2,
  X,
  Plus,
  FileText,
  Image as ImageIcon,
  Tag,
  Settings
} from "lucide-react";
import { articleService } from "../../../api/services/article.sevice";
import { useAuth } from "../../../hooks/auth/useAuth";
import ImageUpload from "../Upload/ImageUpload";
import { toast } from "sonner";
import type { CreateArticleRequest } from "../../../types/content.types";

const CreateArticleForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  // Form data
  const [formData, setFormData] = useState<CreateArticleRequest>({
    title: "",
    content: "",
    excerpt: "",
    category: "",
    tags: "",
    featured_image_url: "",
    meta_description: "",
    status: "draft",
    featured: false,
    allow_comments: true
  });

  // Tags management
  const [currentTag, setCurrentTag] = useState("");
  const [tagsList, setTagsList] = useState<string[]>([]);

  // Categories (có thể fetch từ API)
  const categories = [
    "Sức khỏe trẻ em",
    "Dinh dưỡng",
    "Phát triển tâm lý",
    "Bệnh lý thường gặp",
    "Chăm sóc sơ sinh",
    "Giáo dục sức khỏe",
    "Vaccine và tiêm chủng",
    "An toàn trẻ em"
  ];

  // Handle input changes
  const handleInputChange = (field: keyof CreateArticleRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle image upload
  const handleImageUpload = (imageUrl: string, imageId: string) => {
    handleInputChange('featured_image_url', imageUrl);
    toast.success('Hình ảnh đã được upload thành công!');
  };

  // Handle image remove
  const handleImageRemove = (imageId: string) => {
    handleInputChange('featured_image_url', '');
  };

  // Add tag
  const addTag = () => {
    if (currentTag.trim() && !tagsList.includes(currentTag.trim())) {
      const newTags = [...tagsList, currentTag.trim()];
      setTagsList(newTags);
      setCurrentTag("");
      handleInputChange('tags', newTags.join(', '));
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    const newTags = tagsList.filter(tag => tag !== tagToRemove);
    setTagsList(newTags);
    handleInputChange('tags', newTags.join(', '));
  };

  // Handle tag input key press
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Generate excerpt from content
  const generateExcerpt = () => {
    if (formData.content) {
      const plainText = formData.content.replace(/<[^>]*>/g, ''); // Remove HTML tags
      const excerpt = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
      handleInputChange('excerpt', excerpt);
      toast.success('Đã tự động tạo tóm tắt từ nội dung bài viết');
    }
  };

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.title.trim()) {
      errors.push('Tiêu đề bài viết là bắt buộc');
    }

    if (!formData.content.trim()) {
      errors.push('Nội dung bài viết là bắt buộc');
    }

    if (!formData.category) {
      errors.push('Vui lòng chọn danh mục');
    }

    if (formData.title.length < 10) {
      errors.push('Tiêu đề phải có ít nhất 10 ký tự');
    }

    if (formData.content.length < 100) {
      errors.push('Nội dung phải có ít nhất 100 ký tự');
    }

    return errors;
  };

  // Submit form
  const handleSubmit = async (status: 'draft' | 'published') => {
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setIsSubmitting(true);
    setIsDraft(status === 'draft');

    try {
      const submitData: CreateArticleRequest = {
        ...formData,
        status,
        excerpt: formData.excerpt || formData.content.substring(0, 200) + '...',
        meta_description: formData.meta_description || formData.excerpt || formData.content.substring(0, 160)
      };

      const result = await articleService.createArticle(submitData);

      toast.success(
        status === 'draft'
          ? 'Bài viết đã được lưu nháp thành công!'
          : 'Bài viết đã được đăng thành công!'
      );

      // Navigate to article detail or articles list
      navigate(`/articles/${result.article_id}`);

    } catch (error: any) {
      console.error('Create article error:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi tạo bài viết');
    } finally {
      setIsSubmitting(false);
      setIsDraft(false);
    }
  };

  // Preview article
  const handlePreview = () => {
    if (!formData.title || !formData.content) {
      toast.error('Vui lòng nhập tiêu đề và nội dung để xem trước');
      return;
    }

    // Store data in sessionStorage for preview
    sessionStorage.setItem('article_preview', JSON.stringify(formData));
    window.open('/articles/preview', '_blank');
  };

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Vui lòng đăng nhập để tạo bài viết mới.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tạo bài viết mới
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Chia sẻ kiến thức y tế và kinh nghiệm chăm sóc trẻ với cộng đồng
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!formData.title || !formData.content}
              >
                <Eye className="h-4 w-4 mr-2" />
                Xem trước
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="title">Tiêu đề bài viết *</Label>
                <Input
                  id="title"
                  placeholder="Nhập tiêu đề hấp dẫn cho bài viết..."
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/100 ký tự
                </p>
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="content">Nội dung bài viết *</Label>
                <Textarea
                  id="content"
                  placeholder="Viết nội dung bài viết của bạn tại đây..."
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows={12}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.content.length} ký tự
                </p>
              </div>

              {/* Excerpt */}
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="excerpt">Tóm tắt bài viết</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateExcerpt}
                    disabled={!formData.content}
                  >
                    Tự động tạo
                  </Button>
                </div>
                <Textarea
                  id="excerpt"
                  placeholder="Tóm tắt ngắn gọn về nội dung bài viết..."
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  rows={3}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.excerpt?.length || 0}/300 ký tự
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Hình ảnh đại diện
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
                currentImage={formData.featured_image_url}
                maxFileSize={5}
                acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Đăng bài</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button
                  onClick={() => handleSubmit('published')}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting && !isDraft ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Đăng bài viết
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSubmit('draft')}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting && isDraft ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Lưu nháp
                </Button>
              </div>

              <Separator />

              <div className="text-xs text-gray-500 space-y-1">
                <p>📝 <strong>Lưu ý:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Bài viết sẽ được kiểm duyệt trước khi hiển thị</li>
                  <li>Đảm bảo nội dung chính xác và có giá trị</li>
                  <li>Tránh thông tin y tế không chính thác</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Category & Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Phân loại
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category */}
              <div>
                <Label>Danh mục *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger className="mt-1">
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

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="space-y-2 mt-1">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập tag..."
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={handleTagKeyPress}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTag}
                      disabled={!currentTag.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Tags List */}
                  {tagsList.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tagsList.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-500"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Cài đặt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Featured */}
              <div className="flex items-center justify-between">
                <Label htmlFor="featured" className="text-sm">
                  Bài viết nổi bật
                </Label>
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                  className="rounded"
                />
              </div>

              {/* Allow Comments */}
              <div className="flex items-center justify-between">
                <Label htmlFor="allow_comments" className="text-sm">
                  Cho phép bình luận
                </Label>
                <input
                  type="checkbox"
                  id="allow_comments"
                  checked={formData.allow_comments}
                  onChange={(e) => handleInputChange('allow_comments', e.target.checked)}
                  className="rounded"
                />
              </div>

              {/* Meta Description */}
              <div>
                <Label htmlFor="meta_description" className="text-sm">
                  Meta Description (SEO)
                </Label>
                <Textarea
                  id="meta_description"
                  placeholder="Mô tả ngắn gọn cho SEO..."
                  value={formData.meta_description}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  rows={2}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.meta_description?.length || 0}/160 ký tự
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateArticleForm;