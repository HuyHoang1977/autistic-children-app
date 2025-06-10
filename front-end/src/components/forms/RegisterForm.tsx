"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Alert, AlertDescription } from "../ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Eye, EyeOff, User, Mail, Lock, Phone, Stethoscope, Heart, Loader2 } from "lucide-react"
import { useAuth } from "../../hooks/auth/useAuth"
import { RegisterRequest, UserRole } from "../../types"
import { API_ENDPOINTS } from "../../api/endpoints"

interface RegisterFormProps {
  defaultRole?: UserRole.PARENT | UserRole.DOCTOR
  onSuccess?: () => void
}

const RegisterForm: React.FC<RegisterFormProps> = ({ defaultRole = UserRole.PARENT, onSuccess }) => {
  const navigate = useNavigate()
  const { register, isLoading } = useAuth()

  const [activeTab, setActiveTab] = useState<UserRole>(defaultRole)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [specializations, setSpecializations] = useState<string[]>([])

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    phone: "",
    bio: "",
    // Parent specific
    address: "",
    emergency_contact: "",
    // Doctor specific
    specialty: "",
    qualifications: "",
    license_number: "",
    clinic_name: "",
    clinic_address: "",
  })

  useEffect(() => {
    fetch(API_ENDPOINTS.AUTH.SPECIALIZATIONS)
      .then(res => res.json())
      .then(data => setSpecializations(data))
      .catch(() => setSpecializations([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate required fields
    if (!formData.username || !formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc")
      return
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự")
      return
    }

    // Validate doctor specific fields
    if (activeTab === UserRole.DOCTOR) {
      if (!formData.specialty || !formData.qualifications || !formData.license_number) {
        setError("Vui lòng điền đầy đủ thông tin chuyên môn")
        return
      }
    }

    try {
      const registerData: Omit<typeof formData, "confirmPassword"> & { confirmPassword?: string; role: UserRole } = {
        ...formData,
        role: activeTab,
      }
      delete registerData.confirmPassword

      await register(registerData as RegisterRequest)
      if (onSuccess) {
        onSuccess()
      } else {
        navigate("/")
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserRole)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={UserRole.PARENT} className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Phụ huynh
            </TabsTrigger>
            <TabsTrigger value={UserRole.DOCTOR} className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Bác sĩ
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Common fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Họ *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  type="text"
                  placeholder="Nguyễn"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Tên *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  type="text"
                  placeholder="Văn A"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <Label htmlFor="phone">Số điện thoại</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="0123456789"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role-specific fields */}
            <TabsContent value={UserRole.PARENT} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Liên hệ khẩn cấp</Label>
                <Input
                  id="emergency_contact"
                  name="emergency_contact"
                  type="text"
                  placeholder="Tên và số điện thoại người liên hệ khẩn cấp"
                  value={formData.emergency_contact}
                  onChange={handleChange}
                />
              </div>
            </TabsContent>

            <TabsContent value={UserRole.DOCTOR} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Chuyên khoa *</Label>
                  <Select onValueChange={(value) => handleSelectChange("specialty", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn chuyên khoa" />
                    </SelectTrigger>
                      <SelectContent>
                        {specializations.map((spec) => (
                          <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                        ))}
                        <SelectItem key="other" value="Khác">Khác</SelectItem>
                      </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_number">Số chứng chỉ hành nghề *</Label>
                  <Input
                    id="license_number"
                    name="license_number"
                    type="text"
                    placeholder="VD: 12345/BYT"
                    value={formData.license_number}
                    onChange={handleChange}
                    required={activeTab === UserRole.DOCTOR}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualifications">Bằng cấp & Chứng chỉ *</Label>
                <Textarea
                  id="qualifications"
                  name="qualifications"
                  placeholder="Mô tả bằng cấp, chứng chỉ chuyên môn..."
                  value={formData.qualifications}
                  onChange={handleChange}
                  rows={3}
                  required={activeTab === UserRole.DOCTOR}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic_name">Tên phòng khám/Bệnh viện</Label>
                  <Input
                    id="clinic_name"
                    name="clinic_name"
                    type="text"
                    placeholder="Bệnh viện ABC"
                    value={formData.clinic_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic_address">Địa chỉ phòng khám</Label>
                  <Input
                    id="clinic_address"
                    name="clinic_address"
                    type="text"
                    placeholder="123 Đường XYZ"
                    value={formData.clinic_address}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </TabsContent>

            <div className="space-y-2 mb-6">
              <Label htmlFor="bio">Giới thiệu bản thân (tùy chọn)</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Viết vài dòng giới thiệu về bản thân..."
                value={formData.bio}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng ký...
                </>
              ) : (
                "Đăng ký tài khoản"
              )}
            </Button>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default RegisterForm
