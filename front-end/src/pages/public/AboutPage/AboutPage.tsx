import type React from "react"
import { Link } from "react-router-dom"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { 
  Heart, 
  Users, 
  Stethoscope, 
  Brain, 
  ArrowRight,
  CheckCircle,
  Sparkles,
  Shield,
  Target,
  UserCheck,
  Calendar,
  MessageCircle,
  Settings
} from "lucide-react"
import { useAuth } from "../../../hooks/auth/useAuth"

const AboutPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth()
  
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
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-medium">
              {isAuthenticated ? "Chào mừng bạn quay trở lại!" : "Chăm sóc sức khỏe chuyên nghiệp"}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              {isAuthenticated ? `Xin chào, ${user?.full_name || "bạn"}!` : "Về chúng tôi"}
            </span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-blue-100 leading-relaxed">
            {isAuthenticated 
              ? "Khám phá thêm về nền tảng chăm sóc sức khỏe mà bạn đang tin tưởng" 
              : "Nền tảng chăm sóc sức khỏe chuyên biệt dành cho trẻ em tự kỷ"
            }
          </p>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                  <Target className="h-4 w-4" />
                  {isAuthenticated ? "Cảm ơn bạn đã tin tưởng" : "Câu chuyện của chúng tôi"}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  {isAuthenticated ? (
                    <>
                      Cảm ơn bạn đã 
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> đồng hành</span>
                    </>
                  ) : (
                    <>
                      Đồng hành cùng
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> gia đình</span>
                    </>
                  )}
                </h2>
                <div className="space-y-3">
                  {isAuthenticated ? (
                    <>
                      <p className="text-gray-600 leading-relaxed">
                        Cảm ơn bạn đã tin tưởng và lựa chọn nền tảng của chúng tôi. Chúng tôi cam kết 
                        sẽ tiếp tục cung cấp những dịch vụ chăm sóc sức khỏe tốt nhất cho con em bạn.
                      </p>
                      <p className="text-gray-600 leading-relaxed">
                        Với tư cách là thành viên của cộng đồng, bạn có thể truy cập đầy đủ các tính năng 
                        và nhận được sự hỗ trợ tốt nhất từ đội ngũ chuyên gia của chúng tôi.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 leading-relaxed">
                        Chúng tôi được thành lập với mục tiêu mang đến dịch vụ chăm sóc sức khỏe 
                        chuyên nghiệp và dễ tiếp cận cho trẻ em mắc chứng tự kỷ.
                      </p>
                      <p className="text-gray-600 leading-relaxed">
                        Hiểu được những khó khăn mà các gia đình phải đối mặt, chúng tôi đã xây dựng 
                        một nền tảng kết nối bác sĩ chuyên khoa với các gia đình cần hỗ trợ.
                      </p>
                    </>
                  )}
                </div>
                {isAuthenticated ? (
                  <div className="flex gap-3">
                    <Link to={`/personal/${user?.user_id}`} className="flex items-center">
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                        <Settings className="ml-2 h-4 w-4" />
                        Quản lý tài khoản
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Link to="/register">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                      Tham gia ngay <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl transform rotate-2 opacity-20"></div>
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-2xl shadow-xl">
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
                      {isAuthenticated ? (
                        <UserCheck className="h-10 w-10 text-blue-600" />
                      ) : (
                        <Brain className="h-10 w-10 text-blue-600" />
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {isAuthenticated ? "Cam kết của chúng tôi" : "Sứ mệnh"}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {isAuthenticated ? (
                        <>
                          Chúng tôi cam kết mang lại trải nghiệm tốt nhất cho bạn và gia đình. 
                          Đội ngũ chuyên gia luôn sẵn sàng hỗ trợ 24/7.
                        </>
                      ) : (
                        <>
                          Mang lại sự chăm sóc tốt nhất cho trẻ em tự kỷ thông qua 
                          công nghệ và đội ngũ y tế chuyên nghiệp.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-16 left-16 w-32 h-32 bg-blue-600 rounded-full"></div>
          <div className="absolute bottom-16 right-16 w-24 h-24 bg-purple-600 rounded-full"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-blue-600 px-4 py-2 rounded-full text-sm font-medium shadow-lg mb-4">
              <Heart className="h-4 w-4" />
              Dịch vụ chuyên nghiệp
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Dịch vụ của 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> chúng tôi</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Chúng tôi cung cấp những dịch vụ cần thiết nhất cho việc chăm sóc trẻ em tự kỷ
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto mb-4 relative">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <Stethoscope className="h-8 w-8 text-white mx-auto" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Tư vấn y tế</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 leading-relaxed">
                  Kết nối với các bác sĩ chuyên khoa về tự kỷ hàng đầu
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto mb-4 relative">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <Users className="h-8 w-8 text-white mx-auto" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Cộng đồng</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 leading-relaxed">
                  Chia sẻ kinh nghiệm với các gia đình cùng hoàn cảnh
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto mb-4 relative">
                  <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <Heart className="h-8 w-8 text-white mx-auto" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Hỗ trợ</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 leading-relaxed">
                  Hỗ trợ chăm sóc và theo dõi sức khỏe 24/7
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium shadow-lg mb-4">
                <Shield className="h-4 w-4" />
                {isAuthenticated ? "Những gì bạn nhận được" : "Cam kết chất lượng"}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {isAuthenticated ? (
                  <>
                    Quyền lợi 
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> thành viên</span>
                  </>
                ) : (
                  <>
                    Giá trị 
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> cốt lõi</span>
                  </>
                )}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {isAuthenticated 
                  ? "Những quyền lợi đặc biệt dành riêng cho thành viên của chúng tôi"
                  : "Những nguyên tắc định hướng mọi hoạt động của chúng tôi"
                }
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-lg">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isAuthenticated ? "Tư vấn ưu tiên" : "Chuyên nghiệp"}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {isAuthenticated 
                      ? "Được ưu tiên trong việc đặt lịch và nhận tư vấn từ các bác sĩ chuyên khoa"
                      : "Đội ngũ bác sĩ có kinh nghiệm và chuyên môn cao trong lĩnh vực tự kỷ"
                    }
                  </p>
                </div>
              </div>
              
              <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 hover:shadow-lg">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 flex-shrink-0">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isAuthenticated ? "Hỗ trợ 24/7" : "Tận tâm"}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {isAuthenticated 
                      ? "Nhận hỗ trợ khẩn cấp và tư vấn trực tuyến 24/7 từ đội ngũ chuyên gia"
                      : "Luôn đặt sức khỏe và phúc lợi của trẻ em lên hàng đầu"
                    }
                  </p>
                </div>
              </div>
              
              <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 transition-all duration-300 hover:shadow-lg">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 flex-shrink-0">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isAuthenticated ? "Cộng đồng riêng tư" : "Dễ tiếp cận"}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {isAuthenticated 
                      ? "Tham gia các nhóm hỗ trợ riêng tư và chia sẻ kinh nghiệm với gia đình khác"
                      : "Dịch vụ thuận tiện, dễ sử dụng cho mọi gia đình"
                    }
                  </p>
                </div>
              </div>
              
              <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-all duration-300 hover:shadow-lg">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 flex-shrink-0">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isAuthenticated ? "Bảo mật cao cấp" : "Bảo mật"}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {isAuthenticated 
                      ? "Thông tin y tế được mã hóa và bảo vệ bằng công nghệ bảo mật tiên tiến nhất"
                      : "Thông tin y tế được bảo vệ an toàn và bí mật tuyệt đối"
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-8 w-24 h-24 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-16 w-16 h-16 bg-white/60 rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-16 left-1/4 w-20 h-20 bg-white/40 rounded-full animate-pulse delay-700"></div>
          <div className="absolute bottom-24 right-1/3 w-12 h-12 bg-white/30 rounded-full animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">
                {isAuthenticated ? "Khám phá thêm tính năng" : "Bắt đầu hành trình mới"}
              </span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                {isAuthenticated ? "Tiếp tục hành trình" : "Bắt đầu hành trình"}
              </span>
              <br />
              <span className="text-blue-100">chăm sóc sức khỏe</span>
            </h2>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-blue-100 leading-relaxed">
              {isAuthenticated 
                ? "Khám phá thêm các tính năng hữu ích để chăm sóc sức khỏe con em bạn tốt hơn"
                : "Tham gia cùng chúng tôi để mang lại sự chăm sóc tốt nhất cho con em bạn"
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Link to={`/personal/${user?.user_id}`} className="flex items-center">
                    <Button className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 px-8 py-3 font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      <Settings className="mr-2 h-4 w-4" />
                      Quản lý tài khoản
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register">
                    <Button className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 px-8 py-3 font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      <Users className="mr-2 h-4 w-4" />
                      Đăng ký miễn phí
                    </Button>
                  </Link>
                  <Link to="/doctors">
                    <Button variant="outline" className="text-white border-2 border-white/30 bg-white/10 hover:bg-white hover:text-blue-600 px-8 py-3 font-semibold rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105">
                      <Stethoscope className="mr-2 h-4 w-4" />
                      Tìm bác sĩ
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage