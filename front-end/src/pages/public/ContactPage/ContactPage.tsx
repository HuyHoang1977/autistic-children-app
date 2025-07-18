import type React from "react"
import { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import { Label } from "../../../components/ui/label"
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle,
  Send,
  Heart,
  Users,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  Star,
  Globe,
  Facebook,
  Instagram,
  Youtube
} from "lucide-react"
import { useAuth } from "../../../hooks/auth/useAuth"
import { useToast } from "../../../hooks/use-toast"

const ContactPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: user?.full_name || "",
    email: user?.email || "",
    phone: "",
    subject: "",
    message: "",
    category: "general"
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setIsSubmitted(true)
      toast({
        title: "Gửi thành công!",
        description: "Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi sớm nhất có thể.",
        duration: 5000,
      })
      
      // Reset form
      setFormData({
        name: user?.full_name || "",
        email: user?.email || "",
        phone: "",
        subject: "",
        message: "",
        category: "general"
      })
      
    } catch (error) {
      toast({
        title: "Có lỗi xảy ra",
        description: "Vui lòng thử lại sau hoặc liên hệ qua số hotline.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white py-16 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-8 left-8 w-16 h-16 bg-white/30 rounded-full animate-pulse"></div>
          <div className="absolute top-24 right-16 w-12 h-12 bg-white/20 rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-16 left-1/4 w-18 h-18 bg-white/10 rounded-full animate-pulse delay-700"></div>
          <div className="absolute bottom-32 right-1/3 w-10 h-10 bg-white/25 rounded-full animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
            <MessageCircle className="h-4 w-4 text-blue-300" />
            <span className="text-sm font-medium">
              {isAuthenticated ? `Xin chào, ${user?.full_name || "bạn"}!` : "Liên hệ với chúng tôi"}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Liên hệ với chúng tôi
            </span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-blue-100 leading-relaxed">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn trong việc chăm sóc sức khỏe con em
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 -mt-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Hotline 24/7</h3>
                <p className="text-gray-600 mb-2">Hỗ trợ khẩn cấp</p>
                <p className="text-blue-600 font-semibold">1900 0000</p>
                <p className="text-sm text-gray-500">Miễn phí từ điện thoại cố định</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Email</h3>
                <p className="text-gray-600 mb-2">Liên hệ tư vấn</p>
                <p className="text-green-600 font-semibold">support@autismcare.vn</p>
                <p className="text-sm text-gray-500">Phản hồi trong 24h</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                  Gửi tin nhắn cho chúng tôi
                </CardTitle>
                <p className="text-gray-600">
                  Hãy để lại thông tin, chúng tôi sẽ liên hệ và hỗ trợ bạn sớm nhất có thể.
                </p>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-600 mb-2">Gửi thành công!</h3>
                    <p className="text-gray-600 mb-4">
                      Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
                    </p>
                    <Button 
                      onClick={() => setIsSubmitted(false)}
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50"
                    >
                      Gửi tin nhắn khác
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ và tên *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          placeholder="Nhập họ và tên"
                          className="bg-white/70"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          placeholder="Nhập địa chỉ email"
                          className="bg-white/70"
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Nhập số điện thoại"
                          className="bg-white/70"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Loại yêu cầu</Label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="flex h-10 w-full rounded-md border border-input bg-white/70 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="general">Tư vấn chung</option>
                          <option value="medical">Tư vấn y tế</option>
                          <option value="appointment">Đặt lịch khám</option>
                          <option value="technical">Hỗ trợ kỹ thuật</option>
                          <option value="partnership">Hợp tác</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Chủ đề *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        placeholder="Nhập chủ đề tin nhắn"
                        className="bg-white/70"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Tin nhắn *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        placeholder="Nhập nội dung tin nhắn của bạn..."
                        rows={5}
                        className="bg-white/70"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Gửi tin nhắn
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Contact Info & Map */}
            <div className="space-y-8">
              {/* Why Choose Us */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Tại sao chọn chúng tôi?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Stethoscope className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Đội ngũ chuyên gia</h4>
                      <p className="text-sm text-gray-600">Bác sĩ có chứng chỉ chuyên khoa về tự kỷ</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Cộng đồng hỗ trợ</h4>
                      <p className="text-sm text-gray-600">Kết nối với các gia đình cùng hoàn cảnh</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <Star className="h-3 w-3 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Chất lượng cao</h4>
                      <p className="text-sm text-gray-600">Dịch vụ được đánh giá 5 sao từ người dùng</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-600" />
                    Kết nối với chúng tôi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <a 
                      href="#" 
                      className="flex flex-col items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Facebook className="h-6 w-6 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">Facebook</span>
                    </a>
                    <a 
                      href="#" 
                      className="flex flex-col items-center gap-2 p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
                    >
                      <Instagram className="h-6 w-6 text-pink-600" />
                      <span className="text-xs font-medium text-pink-600">Instagram</span>
                    </a>
                    <a 
                      href="#" 
                      className="flex flex-col items-center gap-2 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Youtube className="h-6 w-6 text-red-600" />
                      <span className="text-xs font-medium text-red-600">YouTube</span>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Câu hỏi thường gặp</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Các câu hỏi và thắc mắc phổ biến từ phụ huynh và bác sĩ
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Làm thế nào để đặt lịch khám?</h3>
                <p className="text-gray-600 text-sm">
                  Bạn có thể đặt lịch khám trực tuyến qua tài khoản hoặc gọi hotline 1900 0000.
                </p>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Chi phí tư vấn như thế nào?</h3>
                <p className="text-gray-600 text-sm">
                  Tư vấn cơ bản miễn phí. Khám chuyên sâu sẽ có phí theo từng dịch vụ.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Có hỗ trợ khẩn cấp không?</h3>
                <p className="text-gray-600 text-sm">
                  Có, chúng tôi có đội ngũ hỗ trợ 24/7 cho các trường hợp khẩn cấp.
                </p>
              </div>
              
              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Thông tin có được bảo mật?</h3>
                <p className="text-gray-600 text-sm">
                  Tất cả thông tin được mã hóa và bảo mật theo tiêu chuẩn y tế quốc tế.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactPage
