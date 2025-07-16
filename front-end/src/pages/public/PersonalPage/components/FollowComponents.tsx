import React from 'react';
import { DoctorInfo, ParentInfo } from '../../../../api/services/personal.service';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Skeleton } from '../../../../components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Users, User, Star } from 'lucide-react';

// Following Content Component
interface FollowingContentProps {
  doctors: DoctorInfo[];
  pagination: any;
  loading: boolean;
  error: string | null;
  onLoadMore: () => void;
  onLoadPrevious: () => void;
  navigate: (path: string) => void;
}

export const FollowingContent: React.FC<FollowingContentProps> = ({ 
  doctors, 
  pagination, 
  loading, 
  error, 
  onLoadMore, 
  onLoadPrevious, 
  navigate 
}) => {
  const handleDoctorClick = (doctor: DoctorInfo) => {
    navigate(`/personal/${doctor.user_info.user_id}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center text-red-600">
          <p>Lỗi khi tải danh sách theo dõi: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!doctors || doctors.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chưa theo dõi ai</h3>
          <p className="text-gray-600">Người dùng này chưa theo dõi bác sĩ nào.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {doctors.map(doctor => (
        <Card 
          key={doctor.doctor_id} 
          className="hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30"
          onClick={() => handleDoctorClick(doctor)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={doctor.user_info.avatar_url} alt={doctor.user_info.full_name} />
                <AvatarFallback>
                  {doctor.user_info.full_name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">
                    {doctor.user_info.full_name}
                  </h3>
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm">{doctor.user_info.email}</p>
                
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-gray-500">
                    <strong>Chuyên khoa:</strong> {doctor.specialty || 'Chưa xác định'}
                  </span>
                  <span className="text-sm text-gray-500">
                    <strong>Kinh nghiệm:</strong> {doctor.years_experience || 0} năm
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${
                          star <= (doctor.rating || 0) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-1">
                      {doctor.rating || 0}/5
                    </span>
                  </div>
                  {doctor.verified && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Đã xác thực
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Simple Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button 
            onClick={onLoadPrevious} 
            disabled={!pagination.has_prev}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.current_page} of {pagination.pages}
          </span>
          <Button 
            onClick={onLoadMore} 
            disabled={!pagination.has_next}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

// Followers Content Component
interface FollowersContentProps {
  followers: ParentInfo[];
  pagination: any;
  loading: boolean;
  error: string | null;
  onLoadMore: () => void;
  onLoadPrevious: () => void;
  navigate: (path: string) => void;
}

export const FollowersContent: React.FC<FollowersContentProps> = ({ 
  followers, 
  pagination, 
  loading, 
  error, 
  onLoadMore, 
  onLoadPrevious, 
  navigate 
}) => {
  console.log('FollowersContent Debug:', {
    followers: followers?.length,
    pagination: pagination?.total,
    loading,
    error,
    followersData: followers
  });

  const handleFollowerClick = (follower: ParentInfo) => {
    navigate(`/personal/${follower.user_info.user_id}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center text-red-600">
          <p>Lỗi khi tải người theo dõi: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!followers || followers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chưa có người theo dõi</h3>
          <p className="text-gray-600">Bác sĩ này chưa có người theo dõi nào.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {followers.map(follower => (
        <Card 
          key={follower.parent_id} 
          className="hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30"
          onClick={() => handleFollowerClick(follower)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={follower.user_info.avatar_url} alt={follower.user_info.full_name} />
                <AvatarFallback>
                  {follower.user_info.full_name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">
                    {follower.user_info.full_name}
                  </h3>
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm">{follower.user_info.email}</p>
                
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-gray-500">
                    <strong>Số con:</strong> {follower.children_count || 0}
                  </span>
                  <span className="text-sm text-gray-500">
                    <strong>Theo dõi từ:</strong> {new Date(follower.followed_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                
                {follower.parenting_concerns && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Mối quan tâm:</strong> {follower.parenting_concerns}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Simple Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button 
            onClick={onLoadPrevious} 
            disabled={!pagination.has_prev}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.current_page} of {pagination.pages}
          </span>
          <Button 
            onClick={onLoadMore} 
            disabled={!pagination.has_next}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
