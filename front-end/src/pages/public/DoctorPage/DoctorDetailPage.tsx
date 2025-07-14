"use client"

import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs"
import {
  Star,
  Users,
  CheckCircle2,
  Heart,
  MessageCircle,
  Calendar,
  Phone,
  Mail,
  Building,
  Award,
  Clock,
  ArrowLeft,
} from "lucide-react"
import { useDoctorDetails } from "../../../hooks/api/useDoctors"
import { formatNumber, formatDate } from "../../../utils/helper"
import ArticleCard from "../../../components/content/ArticleCard/ArticleCard"

const DoctorDetailPage = () => {
  const { doctorId } = useParams<{ doctorId: string }>()
  const { doctor, isLoading, error } = useDoctorDetails(Number(doctorId))
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)

  // Mock data for doctor's articles
  const doctorArticles = [
    {
      article_id: 1,
      content_id: 1,
      title: "Chăm sóc trẻ sơ sinh trong 3 tháng đầu",
      excerpt: "Hướng dẫn chi tiết cách chăm sóc trẻ sơ sinh từ A-Z cho các bậc phụ huynh mới.",
      content: "",
      featured_image: "/placeholder.svg?height=300&width=500",
      reading_time: 10,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      view_count: 2500,
      like_count: 89,
      comment_count: 23,
      share_count: 15,
      is_published: true,
      author: {
        id: Number(doctorId),
        user_id: Number(doctorId),
        username: "doctor_pediatrics",
        full_name: doctor?.full_name || "Bác sĩ",
        avatar_url: doctor?.avatar_url || "",
        role_id: undefined,
        verified: doctor?.verified,
      },
      categories: [
        {
          category_id: 1,
          name: "Sức khỏe trẻ em",
          description: "",
          slug: "suc-khoe-tre-em",
          parent_category_id: null,
          sort_order: 1,
          is_active: true,
        },
      ],
      tags: "",
      interactions: {
        likes: 89,
        comments: 23,
        shares: 15,
        views: 2500,
      },
      userInteractions: {
        isLiked: false,
        isSaved: false,
      },
    },
  ]

  useEffect(() => {
    if (doctor) {
      setFollowersCount(doctor.followers_count)
    }
  }, [doctor])

  const handleFollow = async () => {
    try {
      // Implement follow/unfollow API call here
      setIsFollowing(!isFollowing)
      setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1)
    } catch (error) {
      console.error("Error following/unfollowing doctor:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-start gap-6">
                <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !doctor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy thông tin bác sĩ</h1>
          <p className="text-gray-600 mb-6">Bác sĩ này không tồn tại hoặc đã bị xóa.</p>
          <Button asChild>
            <Link to="/doctors">Quay lại danh sách bác sĩ</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-blue-600">
            Trang chủ
          </Link>
          <span>/</span>
          <Link to="/doctors" className="hover:text-blue-600">
            Bác sĩ
          </Link>
          <span>/</span>
          <span>BS. {doctor.full_name}</span>
        </div>

        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/doctors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Link>
        </Button>

        {/* Doctor Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={doctor.avatar_url || "/placeholder.svg?height=96&width=96"} />
                <AvatarFallback className="text-2xl font-semibold">
                  {doctor.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">BS. {doctor.full_name}</h1>
                  {doctor.verified && <CheckCircle2 className="h-6 w-6 text-blue-600" />}
                </div>

                {/* Specializations */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {doctor.primary_specialty && (
                    <Badge variant="default" className="text-sm">
                      {doctor.primary_specialty}
                    </Badge>
                  )}
                  {doctor.specializations?.map((spec, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {spec.specialization}
                    </Badge>
                  ))}
                </div>

                {/* Rating and Stats */}
                <div className="flex items-center gap-6 mb-4">
                  {doctor.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{doctor.rating.toFixed(1)}</span>
                      <span className="text-gray-500">({formatNumber(doctor.total_reviews || 0)} đánh giá)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="h-5 w-5 text-gray-400" />
                    <span>{formatNumber(followersCount)} theo dõi</span>
                  </div>
                  {doctor.years_experience && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span>{doctor.years_experience} năm kinh nghiệm</span>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {doctor.bio && <p className="text-gray-600 mb-4">{doctor.bio}</p>}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={handleFollow} className="flex items-center gap-2">
                    <Heart className={`h-4 w-4 ${isFollowing ? "fill-current" : ""}`} />
                    {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                    <MessageCircle className="h-4 w-4" />
                    Nhắn tin
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                    <Calendar className="h-4 w-4" />
                    Đặt lịch hẹn
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="about" className="flex-1">
              Thông tin
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex-1">
              Bài viết ({doctorArticles.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1">
              Đánh giá ({formatNumber(doctor.total_reviews || 0)})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin liên hệ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {doctor.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-gray-600">{doctor.email}</p>
                      </div>
                    </div>
                  )}
                  {doctor.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Điện thoại</p>
                        <p className="text-gray-600">{doctor.phone}</p>
                      </div>
                    </div>
                  )}
                  {doctor.clinic_name && (
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Nơi làm việc</p>
                        <p className="text-gray-600">{doctor.clinic_name}</p>
                        {doctor.clinic_address && <p className="text-sm text-gray-500">{doctor.clinic_address}</p>}
                      </div>
                    </div>
                  )}
                  {doctor.license_number && (
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Số chứng chỉ hành nghề</p>
                        <p className="text-gray-600">{doctor.license_number}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin chuyên môn</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">Chuyên khoa</p>
                    <div className="flex flex-wrap gap-2">
                      {doctor.specializations?.map((spec, index) => (
                        <Badge key={index} variant={spec.is_primary ? "default" : "secondary"}>
                          {spec.specialization}
                          {spec.is_primary && " (Chính)"}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {doctor.years_experience && (
                    <div>
                      <p className="font-medium">Kinh nghiệm</p>
                      <p className="text-gray-600">{doctor.years_experience} năm</p>
                    </div>
                  )}

                  {doctor.verification_date && (
                    <div>
                      <p className="font-medium">Ngày xác minh</p>
                      <p className="text-gray-600">{formatDate(doctor.verification_date)}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{formatNumber(followersCount)}</div>
                        <div className="text-sm text-gray-600">Người theo dõi</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{doctor.rating?.toFixed(1) || "N/A"}</div>
                        <div className="text-sm text-gray-600">Đánh giá trung bình</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="articles">
            <Card>
              <CardHeader>
                <CardTitle>Bài viết của BS. {doctor.full_name}</CardTitle>
              </CardHeader>
              <CardContent>
                {doctorArticles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {doctorArticles.map((article) => (
                      <ArticleCard key={article.article_id} article={article} variant="compact" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Bác sĩ chưa có bài viết nào.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Đánh giá từ bệnh nhân</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Chức năng đánh giá đang được phát triển.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default DoctorDetailPage
