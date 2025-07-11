import { API_ENDPOINTS } from '../endpoints';
import apiClient from '../client';
import type {
  Doctor,
  DoctorFilters,
  DoctorsResponse,
  DoctorResponse,
  DoctorSearchResponse,
  SpecializationsResponse,
  DoctorStatisticsResponse,
} from '../../types/doctors.types';

export class DoctorsService {
  /**
   * Lấy danh sách bác sĩ đã xác minh với filter và pagination
   */
  async getDoctors(filters: DoctorFilters = {}): Promise<DoctorsResponse> {
    const params = new URLSearchParams();
    
    // Thêm các filter parameters
    if (filters.search_term) params.append('search_term', filters.search_term);
    if (filters.clinic_name) params.append('clinic_name', filters.clinic_name);
    if (filters.clinic_address) params.append('clinic_address', filters.clinic_address);
    if (filters.specialty) params.append('specialty', filters.specialty);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());

    const url = `${API_ENDPOINTS.DOCTORS.LIST}?${params.toString()}`;
    const response = await apiClient.get<DoctorsResponse>(url);
    return response.data;
  }

  /**
   * Lấy thông tin chi tiết một bác sĩ
   */
  async getDoctorDetails(doctorId: number): Promise<DoctorResponse> {
    const response = await apiClient.get<DoctorResponse>(
      API_ENDPOINTS.DOCTORS.DETAIL(doctorId)
    );
    return response.data;
  }

  /**
   * Tìm kiếm bác sĩ theo chuyên khoa
   */
  async searchDoctorsBySpecialty(
    specialty: string,
    limit: number = 10
  ): Promise<DoctorSearchResponse> {
    const params = new URLSearchParams();
    params.append('specialty', specialty);
    params.append('limit', limit.toString());

    const url = `${API_ENDPOINTS.DOCTORS.SEARCH}?${params.toString()}`;
    const response = await apiClient.get<DoctorSearchResponse>(url);
    return response.data;
  }

  /**
   * Lấy danh sách bác sĩ có rating cao nhất
   */
  async getTopRatedDoctors(limit: number = 10): Promise<DoctorSearchResponse> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    const url = `${API_ENDPOINTS.DOCTORS.TOP_RATED}?${params.toString()}`;
    const response = await apiClient.get<DoctorSearchResponse>(url);
    return response.data;
  }

  /**
   * Lấy danh sách bác sĩ có nhiều followers nhất
   */
  async getMostFollowedDoctors(limit: number = 10): Promise<DoctorSearchResponse> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    const url = `${API_ENDPOINTS.DOCTORS.MOST_FOLLOWED}?${params.toString()}`;
    const response = await apiClient.get<DoctorSearchResponse>(url);
    return response.data;
  }

  /**
   * Lấy danh sách tất cả chuyên khoa
   */
  async getAllSpecializations(): Promise<SpecializationsResponse> {
    const response = await apiClient.get<SpecializationsResponse>(
      API_ENDPOINTS.DOCTORS.SPECIALIZATIONS
    );
    return response.data;
  }

  /**
   * Lấy thống kê tổng quan về bác sĩ
   */
  async getDoctorStatistics(): Promise<DoctorStatisticsResponse> {
    const response = await apiClient.get<DoctorStatisticsResponse>(
      API_ENDPOINTS.DOCTORS.STATISTICS
    );
    return response.data;
  }

  /**
   * Utility method: Lấy danh sách bác sĩ theo multiple filters
   */
  async searchDoctors(searchParams: {
    query?: string;
    specialty?: string;
    clinicName?: string;
    clinicAddress?: string;
    sortBy?: 'rating' | 'followers' | 'experience';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<DoctorsResponse> {
    const filters: DoctorFilters = {
      search_term: searchParams.query,
      specialty: searchParams.specialty,
      clinic_name: searchParams.clinicName,
      clinic_address: searchParams.clinicAddress,
      sort_by: searchParams.sortBy,
      sort_order: searchParams.sortOrder,
      page: searchParams.page,
      per_page: searchParams.limit,
    };

    return this.getDoctors(filters);
  }

  /**
   * Utility method: Lấy bác sĩ theo chuyên khoa cụ thể
   */
  async getDoctorsBySpecialty(
    specialty: string,
    options: {
      sortBy?: 'rating' | 'followers' | 'experience';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<DoctorsResponse> {
    const filters: DoctorFilters = {
      specialty,
      sort_by: options.sortBy || 'rating',
      sort_order: options.sortOrder || 'desc',
      page: options.page || 1,
      per_page: options.limit || 10,
    };

    return this.getDoctors(filters);
  }

  /**
   * Utility method: Tìm kiếm bác sĩ theo tên
   */
  async searchDoctorsByName(
    name: string,
    options: {
      sortBy?: 'rating' | 'followers' | 'experience';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<DoctorsResponse> {
    const filters: DoctorFilters = {
      search_term: name,
      sort_by: options.sortBy || 'rating',
      sort_order: options.sortOrder || 'desc',
      page: options.page || 1,
      per_page: options.limit || 10,
    };

    return this.getDoctors(filters);
  }

  /**
   * Utility method: Lấy bác sĩ theo địa điểm
   */
  async getDoctorsByLocation(
    clinicAddress: string,
    options: {
      sortBy?: 'rating' | 'followers' | 'experience';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<DoctorsResponse> {
    const filters: DoctorFilters = {
      clinic_address: clinicAddress,
      sort_by: options.sortBy || 'rating',
      sort_order: options.sortOrder || 'desc',
      page: options.page || 1,
      per_page: options.limit || 10,
    };

    return this.getDoctors(filters);
  }
}

// Export singleton instance
export const doctorsService = new DoctorsService();
