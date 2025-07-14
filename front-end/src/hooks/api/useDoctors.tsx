"use client"

import { useState, useEffect, useCallback } from "react"
import { doctorsService } from "../../api/services/doctors.service"
import type { Doctor, DoctorFilters, DoctorPagination } from "../../types/doctors.types"

export const useDoctors = (initialFilters: DoctorFilters = {}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [pagination, setPagination] = useState<DoctorPagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<DoctorFilters>(initialFilters)

  const fetchDoctors = useCallback(
    async (newFilters?: DoctorFilters) => {
      setIsLoading(true)
      setError(null)

      try {
        const filtersToUse = newFilters || filters
        const response = await doctorsService.getDoctors(filtersToUse)

        if (response.success) {
          setDoctors(response.data.doctors)
          setPagination(response.data.pagination)
        } else {
          setError(response.error || "Có lỗi xảy ra khi tải danh sách bác sĩ")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi tải danh sách bác sĩ")
      } finally {
        setIsLoading(false)
      }
    },
    [filters],
  )

  const updateFilters = useCallback(
    (newFilters: DoctorFilters) => {
      setFilters(newFilters)
      fetchDoctors(newFilters)
    },
    [fetchDoctors],
  )

  const loadMore = useCallback(() => {
    if (pagination?.has_next) {
      const nextPageFilters = { ...filters, page: (filters.page || 1) + 1 }
      updateFilters(nextPageFilters)
    }
  }, [filters, pagination, updateFilters])

  useEffect(() => {
    fetchDoctors()
  }, [])

  return {
    doctors,
    pagination,
    isLoading,
    error,
    filters,
    updateFilters,
    loadMore,
    refetch: () => fetchDoctors(),
  }
}

export const useSpecializations = () => {
  const [specializations, setSpecializations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const response = await doctorsService.getAllSpecializations()
        if (response.success) {
          setSpecializations(response.data)
        } else {
          setError(response.error || "Có lỗi xảy ra khi tải danh sách chuyên khoa")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi tải danh sách chuyên khoa")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSpecializations()
  }, [])

  return { specializations, isLoading, error }
}

export const useDoctorDetails = (doctorId: number) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      if (!doctorId) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await doctorsService.getDoctorDetails(doctorId)
        if (response.success) {
          setDoctor(response.data)
        } else {
          setError(response.error || "Có lỗi xảy ra khi tải thông tin bác sĩ")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi tải thông tin bác sĩ")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDoctorDetails()
  }, [doctorId])

  return { doctor, isLoading, error }
}

export const useTopRatedDoctors = (limit = 10) => {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopRatedDoctors = async () => {
      try {
        const response = await doctorsService.getTopRatedDoctors(limit)
        if (response.success) {
          setDoctors(response.data)
        } else {
          setError(response.error || "Có lỗi xảy ra khi tải danh sách bác sĩ")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi tải danh sách bác sĩ")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTopRatedDoctors()
  }, [limit])

  return { doctors, isLoading, error }
}

export const useMostFollowedDoctors = (limit = 10) => {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMostFollowedDoctors = async () => {
      try {
        const response = await doctorsService.getMostFollowedDoctors(limit)
        if (response.success) {
          setDoctors(response.data)
        } else {
          setError(response.error || "Có lỗi xảy ra khi tải danh sách bác sĩ")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi tải danh sách bác sĩ")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMostFollowedDoctors()
  }, [limit])

  return { doctors, isLoading, error }
}
