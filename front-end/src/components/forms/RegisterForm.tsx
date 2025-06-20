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
import { RegisterRequest, ROLE_PARENT, ROLE_DOCTOR } from "../../types"
import { API_ENDPOINTS } from "../../api/endpoints"

type UserRole = typeof ROLE_PARENT | typeof ROLE_DOCTOR

interface RegisterFormProps {
  defaultRole?: UserRole
  onSuccess?: () => void
}

const RegisterForm: React.FC<RegisterFormProps> = ({ defaultRole = ROLE_PARENT, onSuccess }) => {
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
    full_name: "",
    phone: "",
    // Parent specific (nếu cần mở rộng)
    // address: "",
    // emergency_contact: "",
    // Doctor specific
    specialty: "",
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
    if (!formData.username || !formData.email || !formData.password || !formData.full_name) {
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
    if (activeTab === ROLE_DOCTOR) {
      if (!formData.specialty || !formData.license_number) {
        setError("Vui lòng điền đầy đủ thông tin chuyên môn")
        return
      }
    }

    try {
      const registerData: RegisterRequest = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone || undefined,
        role_id: activeTab,
        is_active: activeTab === ROLE_PARENT ? true : false,
        // Parent specific (nếu có input)
        // address: activeTab === ROLE_PARENT && formData.address ? formData.address : undefined,
        // emergency_contact: activeTab === ROLE_PARENT && formData.emergency_contact ? formData.emergency_contact : undefined,
        // Doctor specific
        specialty: activeTab === ROLE_DOCTOR ? formData.specialty : undefined,
        license_number: activeTab === ROLE_DOCTOR ? formData.license_number : undefined,
        clinic_name: activeTab === ROLE_DOCTOR ? formData.clinic_name : undefined,
        clinic_address: activeTab === ROLE_DOCTOR ? formData.clinic_address : undefined,
      }

      await register(registerData)
      if (onSuccess) {
        onSuccess()
      } else {
        navigate("/")
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại")
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
        <Tabs value={String(activeTab)} onValueChange={v => setActiveTab(Number(v) as UserRole)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={String(ROLE_PARENT)} className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Phụ huynh
            </TabsTrigger>
            <TabsTrigger value={String(ROLE_DOCTOR)} className="flex items-center gap-2">
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
            <div className="space-y-2 mb-4">
              <Label htmlFor="phone">Họ và Tên</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Phạm Văn A"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="pl-10"
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
            {/* Parent specific fields */}
            {/* Doctor specific fields */}
            <TabsContent value={String(ROLE_DOCTOR)} className="space-y-4">
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
                    required={activeTab === ROLE_DOCTOR}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 mb-4">
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

                <div className="space-y-2 mb-4">
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
