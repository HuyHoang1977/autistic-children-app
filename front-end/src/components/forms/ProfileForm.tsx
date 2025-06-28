import React, { useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { 
  Plus, Edit, Trash2, User as UserIcon, Calendar, Users, Stethoscope, 
  Save, Loader2, Camera, Upload, X, Eye, Download, AlertCircle, CheckCircle2
} from "lucide-react";
import { 
  getProfile, 
  updateProfile, 
  addChild, 
  updateChild, 
  deleteChild,
  uploadAvatar,
  updateAvatar,
  deleteAvatar,
  validateImageFile,
  createImagePreview,
  formatFileSize,
  updateProfileWithValidation,
  addChildWithValidation,
  updateChildWithValidation,
  replaceAvatar
} from "../../api/services/profile.service";
import ChildDialog from "../dialogs/ChildDialog";
import { useAuth } from "../../hooks/auth/useAuth";
import {
  ROLE_PARENT,
  ROLE_DOCTOR,
  User,
  ParentInfo,
  DoctorInfo,
  ChildInfo,
  isParentUser,
} from "../../types/user.types";

interface ProfileFormProps {
  onSuccess?: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onSuccess }) => {
  const { refreshUser, updateUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [userData, setUserData] = useState<Partial<User>>({});
  const [roleData, setRoleData] = useState<Partial<ParentInfo | DoctorInfo>>({});
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Child management states
  const [isChildDialogOpen, setIsChildDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildInfo | null>(null);
  const [children, setChildren] = useState<ChildInfo[]>([]);

  // Avatar management states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setUserData({
        username: data.username,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
      });
      
      if (data.role_id === ROLE_PARENT && data.parent_info) {
        setRoleData({
          children_info: data.parent_info.children_info,
          parenting_concerns: data.parent_info.parenting_concerns,
        });
        // Load children if available
        if (isParentUser(data) && Array.isArray(data.children)) {
          setChildren(data.children);
        }
      }
      
      if (data.role_id === ROLE_DOCTOR && data.doctor_info) {
        setRoleData({
          specialty: data.doctor_info.specialty,
          license_number: data.doctor_info.license_number,
          clinic_name: data.doctor_info.clinic_name,
          clinic_address: data.doctor_info.clinic_address,
          years_experience: data.doctor_info.years_experience,
          bio: data.doctor_info.bio,
        });
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin hồ sơ");
    }
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRoleData((prev) => ({
      ...prev,
      [e.target.name]: e.target.type === "number" ? Number(e.target.value) : e.target.value,
    }));
  };

  const handleSpecialtyChange = (value: string) => {
    setRoleData((prev) => ({
      ...prev,
      specialty: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      console.log('🚀 Starting profile update...');
      
      // Backend sẽ tự động sử dụng user_id từ JWT token để xác định user cần update
      await updateProfileWithValidation(userData, roleData);
      setSuccess("Cập nhật hồ sơ thành công!");
      
      if (onSuccess) onSuccess();
      
      // Update local context immediately
      console.log('🔄 Updating local user context with:', userData);
      updateUser(userData);
      
      // Force header re-render by refreshing user context
      console.log('🔄 Profile updated, refreshing user context...');
      await refreshUser();
      
      // Then fetch full profile for local state sync
      await fetchProfile();
      
      console.log('✅ Profile update complete');
    } catch (err: any) {
      setError(err.message || "Cập nhật hồ sơ thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  // Avatar management functions
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError("");
    
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setAvatarError(validation.error || "File không hợp lệ");
      return;
    }

    try {
      // Create preview
      const preview = await createImagePreview(file);
      setAvatarFile(file);
      setAvatarPreview(preview);
    } catch (err: any) {
      setAvatarError(err.message || "Không thể tạo preview");
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setIsAvatarUploading(true);
    setAvatarError("");

    try {
      // Sử dụng replaceAvatar để tự động xác định upload hay update
      const result = await replaceAvatar(avatarFile);
      setSuccess("Cập nhật avatar thành công!");

      // Clear preview
      setAvatarFile(null);
      setAvatarPreview(null);
      
      // Immediately update user context with new avatar URL
      console.log('🔄 Avatar uploaded, new URL:', result.avatar_url);
      updateUser({ avatar_url: result.avatar_url });
      
      // Small delay to ensure state is updated before refresh
      setTimeout(async () => {
        // Force header re-render by refreshing user context
        console.log('🔄 Avatar updated, refreshing user context...');
        await refreshUser();
        
        // Then fetch updated profile for local state
        await fetchProfile();
        
        console.log('✅ Avatar update complete');
      }, 100);
    } catch (err: any) {
      setAvatarError(err.message || "Upload avatar thất bại");
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!profile?.avatar_url) return;

    if (!window.confirm("Bạn có chắc chắn muốn xóa avatar?")) return;

    setIsAvatarUploading(true);
    setAvatarError("");

    try {
      await deleteAvatar();
      setSuccess("Xóa avatar thành công!");
      
      // Immediately update user context to remove avatar
      console.log('🔄 Avatar deleted, removing from user context');
      updateUser({ avatar_url: null });
      
      // Small delay to ensure state is updated before refresh
      setTimeout(async () => {
        // Force header re-render by refreshing user context
        console.log('🔄 Avatar deleted, refreshing user context...');
        await refreshUser();
        
        // Then fetch updated profile for local state
        await fetchProfile();
        
        console.log('✅ Avatar delete complete');
      }, 100);
    } catch (err: any) {
      setAvatarError(err.message || "Xóa avatar thất bại");
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const clearAvatarPreview = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper function to calculate age
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  // Child management functions
  const handleAddChild = () => {
    setEditingChild(null);
    setIsChildDialogOpen(true);
  };

  const handleEditChild = (child: ChildInfo) => {
    setEditingChild(child);
    setIsChildDialogOpen(true);
  };

  const handleSaveChild = async (childData: Partial<ChildInfo>) => {
    try {
      if (editingChild) {
        // Update existing child với validation
        const updatedChild = await updateChildWithValidation(editingChild.child_id, childData);
        setChildren(prev => prev.map(child => 
          child.child_id === editingChild.child_id ? updatedChild : child
        ));
        setSuccess("Cập nhật thông tin trẻ thành công!");
      } else {
        // Add new child với validation
        const newChild = await addChildWithValidation(childData as Omit<ChildInfo, "child_id" | "parent_id">);
        setChildren(prev => [...prev, newChild]);
        setSuccess("Thêm trẻ mới thành công!");
      }
      await fetchProfile(); // Refresh profile
    } catch (err: any) {
      throw new Error(err.message || "Có lỗi xảy ra khi lưu thông tin trẻ");
    }
  };

  const handleDeleteChild = async (childId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thông tin trẻ này?")) {
      return;
    }
    
    try {
      await deleteChild(childId);
      setChildren(prev => prev.filter(child => child.child_id !== childId));
      setSuccess("Xóa thông tin trẻ thành công!");
      await fetchProfile(); // Refresh profile
    } catch (err: any) {
      setError(err.message || "Xóa thông tin trẻ thất bại");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case ROLE_PARENT: return "Parent";
      case ROLE_DOCTOR: return "Doctor";
      default: return "Admin";
    }
  };

  const getRoleIcon = (roleId: number) => {
    switch (roleId) {
      case ROLE_PARENT: return <Users className="h-8 w-8 text-green-600" />;
      case ROLE_DOCTOR: return <Stethoscope className="h-8 w-8 text-purple-600" />;
      default: return <UserIcon className="h-8 w-8 text-gray-600" />;
    }
  };

  const getRoleBadgeClass = (roleId: number) => {
    switch (roleId) {
      case ROLE_PARENT: return 'bg-green-100 text-green-800';
      case ROLE_DOCTOR: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-muted-foreground">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-3 px-1 sm:px-2 lg:px-4">
      {/* Header */}
      <div className="text-center space-y-1 mb-2">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Quản lý thông tin cá nhân và avatar</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <Alert variant="destructive" className="mx-1 sm:mx-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 mx-1 sm:mx-0">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm">{success}</AlertDescription>
        </Alert>
      )}
      {avatarError && (
        <Alert variant="destructive" className="mx-1 sm:mx-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm">{avatarError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
        {/* Main Profile Form */}
        <div className="flex-1 min-w-0">
          <Card className="shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-2 sm:py-3">
              <CardTitle className="flex items-center gap-2 text-blue-900 text-sm sm:text-base lg:text-lg">
                <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                Thông tin cá nhân
              </CardTitle>
              <CardDescription className="text-blue-700 text-xs sm:text-sm">
                {getRoleName(profile.role_id)}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 lg:p-4">
              <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
                {/* Basic User Info */}
                <div className="space-y-2 lg:space-y-3">
                  <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-3 lg:h-3 bg-blue-500 rounded-full"></div>
                    Thông tin cơ bản
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="username" className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-700">
                        <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        Tên đăng nhập *
                      </Label>
                      <Input
                        id="username"
                        name="username"
                        value={userData.username || ""}
                        onChange={handleUserChange}
                        required
                        className="h-8 sm:h-9 text-xs sm:text-sm"
                        placeholder="Nhập tên đăng nhập"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="full_name" className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-700">
                        <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        Họ và tên *
                      </Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={userData.full_name || ""}
                        onChange={handleUserChange}
                        required
                        className="h-8 sm:h-9 text-xs sm:text-sm"
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email" className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-700">
                        <span className="text-xs sm:text-sm">📧</span>
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={userData.email || ""}
                        onChange={handleUserChange}
                        disabled
                        className="h-8 sm:h-9 bg-gray-50 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-700">
                        <span className="text-xs sm:text-sm">📞</span>
                        Số điện thoại
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={userData.phone || ""}
                        onChange={handleUserChange}
                        placeholder="Nhập số điện thoại"
                        className="h-8 sm:h-9 bg-gray-50 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-3 lg:my-4" />

                {/* Parent specific fields */}
                {profile.role_id === ROLE_PARENT && (
                  <div className="space-y-2 lg:space-y-3">
                    <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-green-900 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full"></div>
                      Thông tin phụ huynh
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-700">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                          Số trẻ: <Badge variant="secondary" className="ml-1 text-xs">{children.length}</Badge>
                        </Label>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="children_info" className="text-xs sm:text-sm font-medium text-gray-700">Thông tin trẻ (tóm tắt)</Label>
                        <Input
                          id="children_info"
                          name="children_info"
                          value={(roleData as ParentInfo).children_info ?? ""}
                          onChange={handleRoleChange}
                          placeholder="Thông tin tóm tắt về các con"
                          className="h-8 sm:h-9 text-xs sm:text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <Label htmlFor="parenting_concerns" className="text-xs sm:text-sm font-medium text-gray-700">Mối quan ngại</Label>
                        <Textarea
                          id="parenting_concerns"
                          name="parenting_concerns"
                          value={(roleData as ParentInfo).parenting_concerns ?? ""}
                          onChange={handleRoleChange}
                          className="min-h-[60px] sm:min-h-[80px] lg:min-h-[100px] resize-none text-xs sm:text-sm"
                          placeholder="Mô tả các mối quan ngại, thách thức hoặc câu hỏi về việc nuôi dạy con..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Doctor specific fields */}
                {profile.role_id === ROLE_DOCTOR && (
                  <div className="space-y-2 lg:space-y-3">
                    <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-purple-900 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-3 lg:h-3 bg-purple-500 rounded-full"></div>
                      Thông tin bác sĩ
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="specialty" className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-700">
                          <Stethoscope className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                          Chuyên khoa
                        </Label>
                        <Input
                          id="specialty"
                          name="specialty"
                          value={(roleData as DoctorInfo).specialty || ""}
                          className="h-8 sm:h-9 bg-gray-50 text-xs sm:text-sm"
                          disabled
                          readOnly
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="license_number" className="text-xs sm:text-sm font-medium text-gray-700">Số giấy phép hành nghề</Label>
                        <Input
                          id="license_number"
                          name="license_number"
                          value={(roleData as DoctorInfo).license_number ?? ""}
                          onChange={handleRoleChange}
                          className="h-8 sm:h-9 bg-gray-50 text-xs sm:text-sm"
                          disabled
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="clinic_name" className="text-xs sm:text-sm font-medium text-gray-700">Tên phòng khám/bệnh viện</Label>
                        <Input
                          id="clinic_name"
                          name="clinic_name"
                          value={(roleData as DoctorInfo).clinic_name ?? ""}
                          onChange={handleRoleChange}
                          className="h-8 sm:h-9 text-xs sm:text-sm"
                          placeholder="Nhập tên phòng khám"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="clinic_address" className="text-xs sm:text-sm font-medium text-gray-700">Địa chỉ phòng khám</Label>
                        <Input
                          id="clinic_address"
                          name="clinic_address"
                          value={(roleData as DoctorInfo).clinic_address ?? ""}
                          onChange={handleRoleChange}
                          className="h-8 sm:h-9 text-xs sm:text-sm"
                          placeholder="Nhập địa chỉ phòng khám"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="years_experience" className="text-xs sm:text-sm font-medium text-gray-700">Số năm kinh nghiệm</Label>
                        <Input
                          id="years_experience"
                          name="years_experience"
                          type="number"
                          value={(roleData as DoctorInfo).years_experience ?? ""}
                          onChange={handleRoleChange}
                          min={0}
                          className="h-8 sm:h-9 text-xs sm:text-sm"
                          placeholder="Nhập số năm kinh nghiệm"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <Label htmlFor="bio" className="text-xs sm:text-sm font-medium text-gray-700">Tiểu sử và kinh nghiệm</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={(roleData as DoctorInfo).bio ?? ""}
                          onChange={handleRoleChange}
                          className="min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] resize-none text-xs sm:text-sm"
                          placeholder="Mô tả về bản thân, kinh nghiệm làm việc, chuyên môn và phương pháp điều trị..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2 lg:pt-3">
                  <Button type="submit" disabled={isLoading} className="min-w-[100px] sm:min-w-[120px] h-8 sm:h-9 text-xs sm:text-sm">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 space-y-3">
          {/* Avatar Management */}
          <Card className="shadow-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 py-3">
              <CardTitle className="flex items-center gap-2 text-purple-900 text-sm sm:text-base">
                <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                Ảnh đại diện
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-4">
                {/* Current Avatar Display */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden border-4 border-white shadow-lg">
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                          <UserIcon className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    {(profile.avatar_url || avatarPreview) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={avatarPreview ? clearAvatarPreview : handleAvatarDelete}
                        disabled={isAvatarUploading}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 bg-red-100 hover:bg-red-200 border-red-200"
                      >
                        <X className="h-3 w-3 text-red-600" />
                      </Button>
                    )}
                  </div>
                  
                  {/* File Selection */}
                  <div className="w-full space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />
                    
                    {!avatarPreview ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAvatarUploading}
                        className="w-full h-8 text-xs"
                      >
                        <Upload className="h-3 w-3 mr-2" />
                        Chọn ảnh
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs text-center text-gray-600">
                          <p className="font-medium">{avatarFile?.name}</p>
                          <p className="text-gray-500">
                            {avatarFile && formatFileSize(avatarFile.size)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={handleAvatarUpload}
                            disabled={isAvatarUploading}
                            size="sm"
                            className="flex-1 h-8 text-xs"
                          >
                            {isAvatarUploading ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Upload className="h-3 w-3 mr-1" />
                            )}
                            {isAvatarUploading ? "Đang tải..." : "Tải lên"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={clearAvatarPreview}
                            disabled={isAvatarUploading}
                            size="sm"
                            className="h-8 px-2"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Avatar Guidelines */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p className="font-medium">Yêu cầu ảnh:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>Định dạng: JPG, PNG, GIF, WEBP</li>
                    <li>Kích thước tối đa: 5MB</li>
                    <li>Khuyến nghị: Ảnh vuông, rõ nét</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Children Management - Only for Parents */}
          {profile.role_id === ROLE_PARENT && (
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 py-3">
                <CardTitle className="flex items-center justify-between text-green-900 text-sm sm:text-base">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                    Quản lý con cái
                  </span>
                  <Button
                    type="button"
                    onClick={handleAddChild}
                    size="sm"
                    className="h-7 px-2 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    <span className="text-xs">Thêm</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                {children.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs sm:text-sm">Chưa có thông tin trẻ em</p>
                    <p className="text-xs text-gray-400 mt-1">Nhấn "Thêm" để bổ sung</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {children.map((child) => (
                      <div 
                        key={child.child_id} 
                        className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {child.name}
                              </h4>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  child.gender === 'male' 
                                    ? 'border-blue-200 text-blue-700 bg-blue-50' 
                                    : 'border-pink-200 text-pink-700 bg-pink-50'
                                }`}
                              >
                                {child.gender === 'male' ? 'Nam' : 'Nữ'}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(child.birth_date)} ({calculateAge(child.birth_date)} tuổi)</span>
                              </div>
                              {(child.weight || child.height) && (
                                <div className="flex items-center gap-3">
                                  {child.weight && <span>Cân nặng: {child.weight}kg</span>}
                                  {child.height && <span>Chiều cao: {child.height}cm</span>}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditChild(child)}
                              className="h-7 w-7 p-0 hover:bg-blue-100"
                            >
                              <Edit className="h-3 w-3 text-blue-600" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteChild(child.child_id)}
                              className="h-7 w-7 p-0 hover:bg-red-100"
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Child Dialog */}
      <ChildDialog
        open={isChildDialogOpen}
        onOpenChange={setIsChildDialogOpen}
        child={editingChild}
        onSave={handleSaveChild}
        mode={editingChild ? "edit" : "add"}
      />
    </div>
  );
};

export default ProfileForm;