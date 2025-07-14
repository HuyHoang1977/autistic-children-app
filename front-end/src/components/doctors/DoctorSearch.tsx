"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Search, Filter, X, MapPin, Stethoscope, Building } from "lucide-react"
import type { DoctorFilters } from "../../types/doctors.types"

interface DoctorSearchProps {
  filters: DoctorFilters
  onFiltersChange: (filters: DoctorFilters) => void
  specializations: string[]
  isLoading?: boolean
}

const DoctorSearch: React.FC<DoctorSearchProps> = ({
  filters,
  onFiltersChange,
  specializations,
  isLoading = false,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState(filters.search_term || "")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onFiltersChange({ ...filters, search_term: searchTerm, page: 1 })
  }

  const handleFilterChange = (key: keyof DoctorFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 })
  }

  const clearFilters = () => {
    setSearchTerm("")
    onFiltersChange({
      search_term: "",
      specialty: undefined,
      clinic_name: "",
      clinic_address: "",
      sort_by: "rating",
      sort_order: "desc",
      page: 1,
    })
  }

  const hasActiveFilters = Boolean(
    filters.search_term || filters.specialty || filters.clinic_name || filters.clinic_address,
  )

  const sortOptions = [
    { value: "rating", label: "Đánh giá cao nhất" },
    { value: "followers", label: "Nhiều người theo dõi" },
    { value: "experience", label: "Kinh nghiệm nhiều nhất" },
  ]

  return (
    <div className="space-y-4">
      {/* Main Search */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm bác sĩ theo tên, chuyên khoa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={hasActiveFilters ? "border-blue-500 text-blue-600" : ""}
            >
              <Filter className="h-4 w-4" />
            </Button>

            <Button type="submit" disabled={isLoading}>
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Bộ lọc nâng cao</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Xóa bộ lọc
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Specialty Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Chuyên khoa
                </label>
                <Select
                  value={filters.specialty || "all"}
                  onValueChange={(value) => handleFilterChange("specialty", value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả chuyên khoa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả chuyên khoa</SelectItem>
                    {specializations.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clinic Name Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Tên phòng khám
                </label>
                <Input
                  type="text"
                  placeholder="Tên phòng khám/bệnh viện"
                  value={filters.clinic_name || ""}
                  onChange={(e) => handleFilterChange("clinic_name", e.target.value)}
                />
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Địa điểm
                </label>
                <Input
                  type="text"
                  placeholder="Thành phố, quận, huyện"
                  value={filters.clinic_address || ""}
                  onChange={(e) => handleFilterChange("clinic_address", e.target.value)}
                />
              </div>

              {/* Sort Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sắp xếp theo</label>
                <Select
                  value={filters.sort_by || "rating"}
                  onValueChange={(value) => handleFilterChange("sort_by", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700">Bộ lọc đang áp dụng:</span>
                  {filters.search_term && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Tìm kiếm: {filters.search_term}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("search_term", "")} />
                    </Badge>
                  )}
                  {filters.specialty && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Chuyên khoa: {filters.specialty}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleFilterChange("specialty", undefined)}
                      />
                    </Badge>
                  )}
                  {filters.clinic_name && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Phòng khám: {filters.clinic_name}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("clinic_name", "")} />
                    </Badge>
                  )}
                  {filters.clinic_address && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Địa điểm: {filters.clinic_address}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("clinic_address", "")} />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DoctorSearch
