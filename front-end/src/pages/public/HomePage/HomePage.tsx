import type React from "react"
import { Link } from "react-router-dom"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Heart, Users, BookOpen, Award, ArrowRight, Stethoscope, Brain, Shield } from "lucide-react"
import { useArticles } from "../../../hooks/api/useArticles"
import { useAuth } from "../../../hooks/auth/useAuth"
import ArticleCard from "../../../components/content/ArticleCard/ArticleCard"

const HomePage: React.FC = () => {
  const { articles: featuredArticles, isLoading } = useArticles({ limit: 6 })
  
  // ✅ Sử dụng useAuth hook thay vì localStorage
  const { isAuthenticated} = useAuth()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white py-16 md:py-20 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 left-6 w-10 h-10 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-5 right-10 w-6 h-6 bg-white/60 rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-16 left-1/4 w-8 h-8 bg-white/40 rounded-full animate-pulse delay-700"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="mb-1">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4 border border-white/20">
              <Heart className="h-4 w-4 text-pink-300" />
              <span className="text-xs md:text-sm font-medium">Chăm sóc sức khỏe trẻ em tự kỷ</span>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Nền tảng sức khỏe
            </span>
            <br />
            <span className="text-blue-200">cho gia đình</span>
          </h1>
          
          <p className="text-base md:text-lg lg:text-xl mb-8 max-w-2xl mx-auto leading-relaxed text-blue-50">
            Kết nối với các bác sĩ chuyên nghiệp về tự kỷ, chia sẻ kiến thức y tế chuyên sâu và 
            <br className="hidden md:block" />
            cùng nhau chăm sóc sức khỏe con em bạn một cách tốt nhất
          </p>
          
          {/* ✅ Chỉ hiển thị khi chưa đăng nhập */}
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
              <Link to="/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 px-6 py-2.5 text-sm font-semibold">
                  <Heart className="h-4 w-4 mr-2" />
                  Đăng ký ngay
                </Button>
              </Link>
              <Link to="/articles">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-white border-2 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white hover:text-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 px-6 py-2.5 text-sm font-semibold"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Khám phá bài viết
                </Button>
              </Link>
            </div>
          )}
          
          {/* ✅ Chỉ hiển thị khi đã đăng nhập */}
          {isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
              <Link to="/articles">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 px-6 py-2.5 text-sm font-semibold">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Khám phá bài viết
                </Button>
              </Link>
              <Link to="/doctors">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-white border-2 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white hover:text-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 px-6 py-2.5 text-sm font-semibold"
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Tìm bác sĩ
                </Button>
              </Link>
            </div>
          )}
          
          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-4 text-blue-200">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs">1,000+ phụ huynh tin tưởng</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" />
              <span className="text-xs">50+ bác sĩ chuyên nghiệp</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span className="text-xs">Được kiểm duyệt y khoa</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 rounded-full px-3 py-1.5 mb-4 font-medium text-sm">
              <Award className="h-3.5 w-3.5" />
              Tính năng nổi bật
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">Tại sao chọn chúng tôi?</h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Chúng tôi cung cấp nền tảng toàn diện để phụ huynh và bác sĩ kết nối, 
              chia sẻ kiến thức chuyên sâu về chăm sóc trẻ em tự kỷ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="text-center group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-red-50 to-pink-50">
              <CardHeader className="pb-2">
                <div className="mx-auto w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300 shadow-md">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-base font-bold text-gray-900">Chăm sóc tận tâm</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 leading-relaxed text-sm">Đội ngũ bác sĩ tình nguyện nhiệt tình hỗ trợ và tư vấn chuyên sâu về tự kỷ</p>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-2">
                <div className="mx-auto w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300 shadow-md">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-base font-bold text-gray-900">Cộng đồng lớn</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 leading-relaxed text-sm">Hàng nghìn phụ huynh và bác sĩ chuyên khoa đang tham gia và chia sẻ</p>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-purple-50 to-violet-50">
              <CardHeader className="pb-2">
                <div className="mx-auto w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300 shadow-md">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-base font-bold text-gray-900">Kiến thức chất lượng</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 leading-relaxed text-sm">Bài viết được kiểm duyệt bởi chuyên gia y tế hàng đầu về tự kỷ</p>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50">
              <CardHeader className="pb-2">
                <div className="mx-auto w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300 shadow-md">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-base font-bold text-gray-900">Uy tín hàng đầu</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 leading-relaxed text-sm">Được tin tưởng bởi hàng nghìn gia đình có con tự kỷ tại Việt Nam</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-600 rounded-full px-3 py-1.5 mb-3 font-medium text-sm">
                <BookOpen className="h-3.5 w-3.5" />
                Nội dung chất lượng
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">Bài viết nổi bật</h2>
              <p className="text-base text-gray-600 max-w-xl">
                Những bài viết được quan tâm và chia sẻ nhiều nhất từ cộng đồng chuyên gia
              </p>
            </div>
            <Link to="/articles">
              <Button variant="outline" className="flex items-center gap-2 px-5 py-2 text-sm font-semibold border-2 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
                Xem tất cả 
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse overflow-hidden border-0 shadow-md">
                  <div className="h-40 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredArticles.slice(0, 6).map((article) => (
                <ArticleCard key={article.article_id} article={article} variant="featured" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* For Parents Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="lg:w-1/2 space-y-5">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 rounded-full px-3 py-1.5 mb-4 font-medium text-sm">
                  <Heart className="h-3.5 w-3.5" />
                  Dành cho phụ huynh
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">
                  Hành trình chăm sóc con yêu
                </h2>
                <p className="text-base text-gray-600 mb-6 leading-relaxed">
                  Tiếp cận kiến thức y tế chất lượng từ các bác sĩ chuyên môn về tự kỷ. 
                  Tìm hiểu về sức khỏe và phát triển của trẻ em để đồng hành cùng con trên con đường phát triển.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-sm">Theo dõi bác sĩ yêu thích</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">Kết nối với các chuyên gia hàng đầu về tự kỷ và nhận thông báo về bài viết mới nhất</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-sm">Lưu trữ bài viết quan trọng</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">Tạo thư viện kiến thức cá nhân về các phương pháp can thiệp và chăm sóc hiệu quả</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-sm">Quản lý hồ sơ sức khỏe</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">Theo dõi tiến trình phát triển và lưu trữ thông tin y tế của con một cách an toàn</p>
                  </div>
                </div>
              </div>

              {/* ✅ Chỉ hiển thị khi chưa đăng nhập */}
              {!isAuthenticated && (
                <div className="pt-3">
                  <Link to="/register?role=parent">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-2.5 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                      <Heart className="h-4 w-4 mr-2" />
                      Đăng ký làm phụ huynh
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl transform rotate-1 opacity-20"></div>
                <div className="relative bg-white rounded-xl p-5 shadow-xl">
                  <img
                    src="https://thecoupleconnection.net/wp-content/uploads/2022/12/Parents-To-Support-Their-Kids.jpg?height=300&width=400"
                    alt="Phụ huynh và con"
                    className="rounded-lg w-full h-auto object-cover"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Heart className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-base">1000+</div>
                      <div className="text-xs text-gray-600">Phụ huynh tin tưởng</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Doctors Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-10">
            <div className="lg:w-1/2 space-y-5">
              <div>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-600 rounded-full px-3 py-1.5 mb-4 font-medium text-sm">
                  <Stethoscope className="h-3.5 w-3.5" />
                  Dành cho bác sĩ
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">
                  Chia sẻ chuyên môn, lan tỏa yêu thương
                </h2>
                <p className="text-base text-gray-600 mb-6 leading-relaxed">
                  Chia sẻ kiến thức chuyên môn về tự kỷ và giúp đỡ cộng đồng. 
                  Xây dựng danh tiếng chuyên nghiệp và kết nối với phụ huynh có con tự kỷ.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-all duration-300 border border-blue-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-sm">Chia sẻ chuyên môn y khoa</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">Đóng góp kiến thức sâu rộng về chẩn đoán, điều trị và can thiệp sớm cho trẻ tự kỷ</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all duration-300 border border-purple-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-sm">Viết bài về lĩnh vực chuyên môn</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">Tạo nội dung giáo dục chất lượng cao về các phương pháp liệu pháp hiện đại</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-all duration-300 border border-green-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-sm">Được xác minh danh tính chuyên môn</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">Hệ thống xác thực nghiêm ngặt đảm bảo uy tín và chất lượng thông tin y khoa</p>
                  </div>
                </div>
              </div>

              {/* ✅ Chỉ hiển thị khi chưa đăng nhập */}
              {!isAuthenticated && (
                <div className="pt-3">
                  <Link to="/register?role=doctor">
                    <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-6 py-2.5 text-sm font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5">
                      <Stethoscope className="h-4 w-4 mr-2" />
                      Đăng ký làm bác sĩ tình nguyện
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl transform -rotate-1 opacity-20"></div>
                <div className="relative bg-white rounded-xl p-5 shadow-xl">
                  <img
                    src="https://www.firstthingsfirst.org/wp-content/uploads/2017/12/Childrens-Healthcare-1.jpg?height=300&width=400"
                    alt="Bác sĩ tình nguyện"
                    className="rounded-lg w-full h-auto object-cover"
                  />
                </div>
                <div className="absolute -bottom-3 -left-3 bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">50+</div>
                      <div className="text-xs text-gray-600">Bác sĩ chuyên nghiệp</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-6 left-6 w-10 h-10 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-16 right-8 w-8 h-8 bg-white/50 rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-12 left-1/4 w-6 h-6 bg-white/30 rounded-full animate-pulse delay-700"></div>
          <div className="absolute bottom-16 right-1/3 w-12 h-12 bg-white/20 rounded-full animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-5 border border-white/30">
              <Heart className="h-4 w-4 text-pink-300" />
              <span className="font-medium text-sm">Tham gia cộng đồng ngay hôm nay</span>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-bold mb-5 leading-tight">
              Bắt đầu hành trình 
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                chăm sóc sức khỏe gia đình
              </span>
            </h2>
            
            <p className="text-base md:text-lg mb-6 max-w-xl mx-auto leading-relaxed text-blue-100">
              Tham gia cộng đồng ngay hôm nay để nhận được những lời khuyên y tế tốt nhất 
              cho việc chăm sóc trẻ em tự kỷ
            </p>
            
            {/* ✅ Chỉ hiển thị khi chưa đăng nhập */}
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link to="/register?role=parent">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 px-6 py-2.5 text-sm font-bold">
                    <Heart className="h-4 w-4 mr-2" />
                    Đăng ký làm phụ huynh
                  </Button>
                </Link>
                <Link to="/register?role=doctor">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-white border-2 border-white/50 bg-white/10 backdrop-blur-sm hover:bg-white hover:text-blue-600 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 px-6 py-2.5 text-sm font-bold"
                  >
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Đăng ký làm bác sĩ tình nguyện
                  </Button>
                </Link>
              </div>
            )}

            {/* ✅ Hiển thị khi đã đăng nhập */}
            {isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link to="/doctors">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 px-6 py-2.5 text-sm font-bold">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Tìm bác sĩ chuyên nghiệp
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Những con số ấn tượng</h2>
            <p className="text-base text-gray-600">Cộng đồng chăm sóc sức khỏe trẻ em tự kỷ lớn nhất Việt Nam</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center group">
              <div className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 border border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform duration-300 shadow-md">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1 group-hover:scale-105 transition-transform duration-300">1000+</div>
                <div className="text-gray-700 font-semibold text-sm">Phụ huynh tin tưởng</div>
                <div className="text-xs text-gray-500 mt-1">Đang đồng hành cùng con</div>
              </div>
            </div>
            
            <div className="text-center group">
              <div className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 border border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform duration-300 shadow-md">
                  <Stethoscope className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-green-600 mb-1 group-hover:scale-105 transition-transform duration-300">50+</div>
                <div className="text-gray-700 font-semibold text-sm">Bác sĩ tình nguyện</div>
                <div className="text-xs text-gray-500 mt-1">Chuyên gia về tự kỷ</div>
              </div>
            </div>
            
            <div className="text-center group">
              <div className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 border border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform duration-300 shadow-md">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-purple-600 mb-1 group-hover:scale-105 transition-transform duration-300">500+</div>
                <div className="text-gray-700 font-semibold text-sm">Bài viết chất lượng</div>
                <div className="text-xs text-gray-500 mt-1">Được kiểm duyệt y khoa</div>
              </div>
            </div>
            
            <div className="text-center group">
              <div className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 border border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform duration-300 shadow-md">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-orange-600 mb-1 group-hover:scale-105 transition-transform duration-300">100+</div>
                <div className="text-gray-700 font-semibold text-sm">Lượt tư vấn</div>
                <div className="text-xs text-gray-500 mt-1">Hỗ trợ chuyên môn</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage