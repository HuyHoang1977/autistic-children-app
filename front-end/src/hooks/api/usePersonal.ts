import { useState, useEffect } from 'react';
import { PersonalService, PersonalProfile, Article, ArticleStats, DoctorInfo, ParentInfo, FollowStats, DashboardData, PaginatedResponse } from '../../api/services/personal.service';

// ✅ Hook for User Profile
export const useUserProfile = (userId?: number) => {
  const [profile, setProfile] = useState<PersonalProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (targetUserId?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = targetUserId 
        ? await PersonalService.getUserProfile(targetUserId)
        : await PersonalService.getMyProfile();
      
      if (response.success) {
        setProfile(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to fetch profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    }
  }, [userId]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    refetch: () => fetchProfile(userId)
  };
};

// ✅ Hook for My Profile
export const useMyProfile = () => {
  return useUserProfile();
};

// ✅ Hook for User Articles
export const useUserArticles = (userId?: number, initialPage: number = 1, initialPerPage: number = 10) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    current_page: initialPage,
    has_next: false,
    has_prev: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = async (page: number = initialPage, perPage: number = initialPerPage, targetUserId?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = targetUserId 
        ? await PersonalService.getUserArticles(targetUserId, page, perPage)
        : await PersonalService.getMyArticles(page, perPage);
      
      console.log('UseUserArticles API Response:', response);
      
      if (response.success && response.data) {
        console.log('Setting articles data:', response.data);
        setArticles(response.data.data);
        setPagination({
          total: response.data.total,
          pages: response.data.pages,
          current_page: response.data.current_page,
          has_next: response.data.has_next,
          has_prev: response.data.has_prev
        });
      } else {
        console.log('Articles API error:', response.message);
        setError(response.message);
      }
    } catch (err) {
      console.error('Articles fetch error:', err);
      setError('Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (pagination.has_next) {
      fetchArticles(pagination.current_page + 1, initialPerPage, userId);
    }
  };

  const loadPrevious = () => {
    if (pagination.has_prev) {
      fetchArticles(pagination.current_page - 1, initialPerPage, userId);
    }
  };

  useEffect(() => {
    fetchArticles(initialPage, initialPerPage, userId);
  }, [userId, initialPage, initialPerPage]);

  return {
    articles,
    pagination,
    loading,
    error,
    fetchArticles,
    loadMore,
    loadPrevious,
    refetch: () => fetchArticles(pagination.current_page, initialPerPage, userId)
  };
};

// ✅ Hook for My Articles
export const useMyArticles = (initialPage: number = 1, initialPerPage: number = 10) => {
  return useUserArticles(undefined, initialPage, initialPerPage);
};

// ✅ Hook for Article Statistics
export const useArticleStats = (userId?: number) => {
  const [stats, setStats] = useState<ArticleStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (targetUserId?: number) => {
    if (!targetUserId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await PersonalService.getArticleStats(targetUserId);
      
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to fetch article statistics');
      console.error('Article stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchStats(userId);
    }
  }, [userId]);

  return {
    stats,
    loading,
    error,
    fetchStats,
    refetch: () => fetchStats(userId)
  };
};

// ✅ Hook for Following Doctors
export const useFollowingDoctors = (userId?: number, initialPage: number = 1, initialPerPage: number = 10) => {
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    current_page: initialPage,
    has_next: false,
    has_prev: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowingDoctors = async (page: number = initialPage, perPage: number = initialPerPage, targetUserId?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = targetUserId 
        ? await PersonalService.getFollowingDoctors(targetUserId, page, perPage)
        : await PersonalService.getMyFollowing(page, perPage);
      
      if (response.success && response.data) {
        setDoctors(response.data.data);
        setPagination({
          total: response.data.total,
          pages: response.data.pages,
          current_page: response.data.current_page,
          has_next: response.data.has_next,
          has_prev: response.data.has_prev
        });
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to fetch following doctors');
      console.error('Following doctors fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (pagination.has_next) {
      fetchFollowingDoctors(pagination.current_page + 1, initialPerPage, userId);
    }
  };

  const loadPrevious = () => {
    if (pagination.has_prev) {
      fetchFollowingDoctors(pagination.current_page - 1, initialPerPage, userId);
    }
  };

  useEffect(() => {
    fetchFollowingDoctors(initialPage, initialPerPage, userId);
  }, [userId, initialPage, initialPerPage]);

  return {
    doctors,
    pagination,
    loading,
    error,
    fetchFollowingDoctors,
    loadMore,
    loadPrevious,
    refetch: () => fetchFollowingDoctors(pagination.current_page, initialPerPage, userId)
  };
};

// ✅ Hook for My Following
export const useMyFollowing = (initialPage: number = 1, initialPerPage: number = 10) => {
  return useFollowingDoctors(undefined, initialPage, initialPerPage);
};

// ✅ Hook for Doctor Followers
export const useDoctorFollowers = (userId?: number, initialPage: number = 1, initialPerPage: number = 10) => {
  const [followers, setFollowers] = useState<ParentInfo[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    current_page: initialPage,
    has_next: false,
    has_prev: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowers = async (page: number = initialPage, perPage: number = initialPerPage, targetUserId?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = targetUserId 
        ? await PersonalService.getDoctorFollowers(targetUserId, page, perPage)
        : await PersonalService.getMyFollowers(page, perPage);
      
      console.log('UseDoctorFollowers API Response:', response);
      
      if (response.success && response.data) {
        console.log('Setting followers data:', response.data);
        setFollowers(response.data.data);
        setPagination({
          total: response.data.total,
          pages: response.data.pages,
          current_page: response.data.current_page,
          has_next: response.data.has_next,
          has_prev: response.data.has_prev
        });
      } else {
        console.log('Followers API error:', response.message);
        setError(response.message);
      }
    } catch (err) {
      console.error('Followers fetch error:', err);
      setError('Failed to fetch followers');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (pagination.has_next) {
      fetchFollowers(pagination.current_page + 1, initialPerPage, userId);
    }
  };

  const loadPrevious = () => {
    if (pagination.has_prev) {
      fetchFollowers(pagination.current_page - 1, initialPerPage, userId);
    }
  };

  useEffect(() => {
    fetchFollowers(initialPage, initialPerPage, userId);
  }, [userId, initialPage, initialPerPage]);

  return {
    followers,
    pagination,
    loading,
    error,
    fetchFollowers,
    loadMore,
    loadPrevious,
    refetch: () => fetchFollowers(pagination.current_page, initialPerPage, userId)
  };
};

// ✅ Hook for My Followers
export const useMyFollowers = (initialPage: number = 1, initialPerPage: number = 10) => {
  return useDoctorFollowers(undefined, initialPage, initialPerPage);
};

// ✅ Hook for Follow Statistics
export const useFollowStats = (userId?: number) => {
  const [stats, setStats] = useState<FollowStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (targetUserId?: number) => {
    if (!targetUserId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await PersonalService.getFollowStats(targetUserId);
      
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to fetch follow statistics');
      console.error('Follow stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchStats(userId);
    }
  }, [userId]);

  return {
    stats,
    loading,
    error,
    fetchStats,
    refetch: () => fetchStats(userId)
  };
};

// ✅ Hook for Dashboard
export const useDashboard = (userId?: number) => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async (targetUserId?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = targetUserId 
        ? await PersonalService.getDashboard(targetUserId)
        : await PersonalService.getMyDashboard();
      
      if (response.success) {
        setDashboard(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to fetch dashboard');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchDashboard(userId);
    }
  }, [userId]);

  return {
    dashboard,
    loading,
    error,
    fetchDashboard,
    refetch: () => fetchDashboard(userId)
  };
};

// ✅ Hook for My Dashboard
export const useMyDashboard = () => {
  return useDashboard();
};
