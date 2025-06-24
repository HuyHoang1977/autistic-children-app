import type React from "react"
import { Link } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Heart, Users, BookOpen, Award, ArrowRight, Stethoscope, Brain, Shield } from "lucide-react"
import { useArticles } from "../../hooks/api/useArticles"
import ArticleCard from "../../components/content/ArticleCard/ArticleCard"

const HomePage: React.FC = () => {
  const { articles: featuredArticles, isLoading } = useArticles({ limit: 6 })

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Nền tảng sức khỏe cho gia đình</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Kết nối với các bác sĩ chuyên nghiệp, chia sẻ kiến thức y tế và chăm sóc sức khỏe con em bạn
          </p>
          <div className="space-x-4">
            <Link to="/register">
              <Button size="lg" variant="secondary">
                Đăng ký ngay
              </Button>
            </Link>
            <Link to="/articles">
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-blue-600"
              >
                Khám phá bài viết
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tại sao chọn chúng tôi?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Chúng tôi cung cấp nền tảng toàn diện để phụ huynh và bác sĩ kết nối, chia sẻ kiến thức
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Chăm sóc tận tâm</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Đội ngũ bác sĩ tình nguyện nhiệt tình hỗ trợ và tư vấn</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Cộng đồng lớn</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Hàng nghìn phụ huynh và bác sĩ đang tham gia</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Kiến thức chất lượng</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Bài viết được kiểm duyệt bởi chuyên gia y tế</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Uy tín hàng đầu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Được tin tưởng bởi hàng nghìn gia đình Việt Nam</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Bài viết nổi bật</h2>
              <p className="text-gray-600">Những bài viết được quan tâm nhất từ cộng đồng</p>
            </div>
            <Link to="/articles">
              <Button variant="outline" className="flex items-center gap-2">
                Xem tất cả <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArticles.slice(0, 6).map((article) => (
                <ArticleCard key={article.article_id} article={article} variant="featured" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* For Parents Section */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-4">Dành cho phụ huynh</h2>
              <p className="text-gray-600 mb-6">
                Tiếp cận kiến thức y tế chất lượng từ các bác sĩ chuyên môn. Tìm hiểu về sức khỏe và phát triển của trẻ
                em.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-blue-600" />
                  <span>Theo dõi bác sĩ yêu thích</span>
                </li>
                <li className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span>Lưu trữ bài viết quan trọng</span>
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Quản lý hồ sơ sức khỏe của con</span>
                </li>
              </ul>
              <Link to="/register?role=parent">
                <Button>Đăng ký làm phụ huynh</Button>
              </Link>
            </div>
            <div className="md:w-1/2">
              <img
                src="/placeholder.svg?height=400&width=600"
                alt="Phụ huynh và con"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* For Doctors Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-4">Dành cho bác sĩ</h2>
              <p className="text-gray-600 mb-6">
                Chia sẻ kiến thức chuyên môn và giúp đỡ cộng đồng. Xây dựng danh tiếng và kết nối với phụ huynh.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                  <span>Chia sẻ chuyên môn y khoa</span>
                </li>
                <li className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <span>Viết bài về lĩnh vực chuyên môn</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span>Được xác minh danh tính chuyên môn</span>
                </li>
              </ul>
              <Link to="/register?role=doctor">
                <Button>Đăng ký làm bác sĩ tình nguyện</Button>
              </Link>
            </div>
            <div className="md:w-1/2">
              <img
                src="/placeholder.svg?height=400&width=600"
                alt="Bác sĩ tình nguyện"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Bắt đầu hành trình chăm sóc sức khỏe gia đình</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Tham gia cộng đồng ngay hôm nay để nhận được những lời khuyên y tế tốt nhất
          </p>
          <div className="space-x-4">
            <Link to="/register?role=parent">
              <Button size="lg" variant="secondary">
                Đăng ký làm phụ huynh
              </Button>
            </Link>
            <Link to="/register?role=doctor">
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-blue-600"
              >
                Đăng ký làm bác sĩ tình nguyện
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-gray-600">Phụ huynh tin tưởng</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600">Bác sĩ tình nguyện</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">5,000+</div>
              <div className="text-gray-600">Bài viết chất lượng</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">50,000+</div>
              <div className="text-gray-600">Lượt tư vấn</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
