"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs"
import { Star, Users, Award, TrendingUp, Loader2 } from "lucide-react"
import {
  useDoctors,
  useSpecializations,
  useTopRatedDoctors,
  useMostFollowedDoctors,
} from "../../../hooks/api/useDoctors"
import DoctorCard from "../../../components/doctors/DoctorCard"
import DoctorSearch from "../../../components/doctors/DoctorSearch"
import type { DoctorFilters } from "../../../types/doctors.types"
import { formatNumber } from "../../../utils/helper"

const DoctorsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState("all")

  // Initialize filters from URL params
  const initialFilters: DoctorFilters = {
    search_term: searchParams.get("search") || "",
    specialty: searchParams.get("specialty") || undefined,
    clinic_address: searchParams.get("location") || "",
    sort_by: (searchParams.get("sort") as any) || "rating",
    sort_order: (searchParams.get("order") as any) || "desc",
    page: 1,
    per_page: 12,
  }

  const { doctors, pagination, isLoading, error, filters, updateFilters, loadMore } = useDoctors(initialFilters)

  const { specializations } = useSpecializations()
  const { doctors: topRatedDoctors, isLoading: loadingTopRated } = useTopRatedDoctors(8)
  const { doctors: mostFollowedDoctors, isLoading: loadingMostFollowed } = useMostFollowedDoctors(8)

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search_term) params.set("search", filters.search_term)
    if (filters.specialty) params.set("specialty", filters.specialty)
    if (filters.clinic_address) params.set("location", filters.clinic_address)
    if (filters.sort_by) params.set("sort", filters.sort_by)
    if (filters.sort_order) params.set("order", filters.sort_order)

    setSearchParams(params)
  }, [filters, setSearchParams])

  const handleFiltersChange = (newFilters: DoctorFilters) => {
    updateFilters(newFilters)
  }

  const handleFollowDoctor = async (doctorId: number) => {
    // Implement follow/unfollow logic here
    console.log("Follow/unfollow doctor:", doctorId)
  }

  const renderDoctorGrid = (doctorsList: any[], loading: boolean) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (doctorsList.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-medium mb-2">Không tìm thấy bác sĩ</h3>
          <p className="text-gray-600">Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {doctorsList.map((doctor) => (
          <DoctorCard key={doctor.doctor_id} doctor={doctor} onFollow={handleFollowDoctor} showFollowButton={true} />
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Danh sách bác sĩ</h1>
        <p className="text-gray-600">Tìm kiếm và kết nối với các bác sĩ chuyên nghiệp đã được xác minh</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <DoctorSearch
          filters={filters}
          onFiltersChange={handleFiltersChange}
          specializations={specializations}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-red-600 mb-4">Có lỗi xảy ra khi tải danh sách bác sĩ</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Thử lại</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {renderDoctorGrid(doctors, isLoading)}

            {/* Load More */}
            {pagination?.has_next && (
              <div className="text-center mt-8">
                <Button onClick={loadMore} variant="outline" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    "Xem thêm bác sĩ"
                  )}
                </Button>
              </div>
            )}

            {/* Pagination Info */}
            {pagination && (
              <div className="text-center mt-4 text-sm text-gray-600">
                Hiển thị {doctors.length} trong tổng số {formatNumber(pagination.total)} bác sĩ
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default DoctorsPage
