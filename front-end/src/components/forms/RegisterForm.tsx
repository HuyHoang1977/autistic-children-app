"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Alert, AlertDescription } from "../ui/alert"
import { Loader2 } from "lucide-react"
import { useAuth } from "../../hooks/auth/useAuth"
import { RegisterRequest, ROLE_ADMIN, ROLE_DOCTOR, ROLE_PARENT } from "../../types"
import { API_ENDPOINTS } from "../../api/endpoints"

const RegisterForm: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterRequest>({
    username: "",
    email: "",
    password: "",
    full_name: "",
    role_id: ROLE_PARENT,
    number_of_children: 0,
    children_info: "",
    parenting_concerns: "",
    specialty: "",
    license_number: "",
    clinic_name: "",
    clinic_address: "",
    years_experience: 0,
    bio: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      errors.push("Tên người dùng chỉ được chứa chữ cái, số, dấu gạch dưới (_) hoặc gạch ngang (-).");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Email không hợp lệ.");
    }
    if (formData.password.length < 8) {
      errors.push("Mật khẩu phải có ít nhất 8 ký tự.");
    }
    if (formData.role_id === ROLE_PARENT && (formData.number_of_children ?? 0) < 0) {
      errors.push("Số con không được âm.");
    }
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "number_of_children" || name === "years_experience" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    const numValue = Number(value);
    setFormData((prev) => ({
      ...prev,
      role_id: numValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);

    const formErrors = validateForm();
    if (formErrors.length > 0) {
      setErrors(formErrors);
      setIsLoading(false);
      return;
    }

    try {
      console.log("Form data:", JSON.stringify(formData, null, 2));
      await register(formData);
      alert("Đăng ký thành công!");
      navigate("/login");
    } catch (error: any) {
      const errorMessages = error.cause?.errors?.map((err: any) => typeof err === 'string' ? err : `${err.field}: ${err.message}`) || [error.message || "Đăng ký thất bại! Vui lòng kiểm tra lại thông tin."];
      console.error("Registration failed:", errorMessages);
      setErrors(errorMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Đăng ký</CardTitle>
        <CardDescription>Tạo tài khoản mới</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul>
                  {errors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          <div>
            <Label htmlFor="username">Tên người dùng</Label>
            <Input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Tên người dùng"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mật khẩu"
              required
            />
          </div>
          <div>
            <Label htmlFor="full_name">Họ và Tên</Label>
            <Input
              id="full_name"
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Họ và Tên"
              required
            />
          </div>
          <div>
            <Label htmlFor="role_id">Vai trò</Label>
            <Select
              name="role_id"
              onValueChange={handleSelectChange}
              value={formData.role_id.toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROLE_ADMIN.toString()}>Quản trị viên</SelectItem>
                <SelectItem value={ROLE_DOCTOR.toString()}>Bác sĩ</SelectItem>
                <SelectItem value={ROLE_PARENT.toString()}>Phụ huynh</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.role_id === ROLE_PARENT && (
            <>
              <div>
                <Label htmlFor="number_of_children">Số con</Label>
                <Input
                  id="number_of_children"
                  type="number"
                  name="number_of_children"
                  value={formData.number_of_children}
                  onChange={handleChange}
                  placeholder="Số con"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="children_info">Thông tin con</Label>
                <Input
                  id="children_info"
                  type="text"
                  name="children_info"
                  value={formData.children_info}
                  onChange={handleChange}
                  placeholder="Thông tin về con"
                />
              </div>
              <div>
                <Label htmlFor="parenting_concerns">Mối quan ngại về nuôi dạy con</Label>
                <Input
                  id="parenting_concerns"
                  type="text"
                  name="parenting_concerns"
                  value={formData.parenting_concerns}
                  onChange={handleChange}
                  placeholder="Mối quan ngại về nuôi dạy con"
                />
              </div>
            </>
          )}
          {formData.role_id === ROLE_DOCTOR && (
            <>
              <div>
                <Label htmlFor="specialty">Chuyên khoa</Label>
                <Input
                  id="specialty"
                  type="text"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  placeholder="Chuyên khoa"
                />
              </div>
              <div>
                <Label htmlFor="license_number">Số giấy phép</Label>
                <Input
                  id="license_number"
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  placeholder="Số giấy phép"
                />
              </div>
              <div>
                <Label htmlFor="clinic_name">Tên phòng khám</Label>
                <Input
                  id="clinic_name"
                  type="text"
                  name="clinic_name"
                  value={formData.clinic_name}
                  onChange={handleChange}
                  placeholder="Tên phòng khám"
                />
              </div>
              <div>
                <Label htmlFor="clinic_address">Địa chỉ phòng khám</Label>
                <Input
                  id="clinic_address"
                  type="text"
                  name="clinic_address"
                  value={formData.clinic_address}
                  onChange={handleChange}
                  placeholder="Địa chỉ phòng khám"
                />
              </div>
              <div>
                <Label htmlFor="years_experience">Số năm kinh nghiệm</Label>
                <Input
                  id="years_experience"
                  type="number"
                  name="years_experience"
                  value={formData.years_experience}
                  onChange={handleChange}
                  placeholder="Số năm kinh nghiệm"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="bio">Tiểu sử</Label>
                <Input
                  id="bio"
                  type="text"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tiểu sử"
                />
              </div>
            </>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Đăng ký"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;