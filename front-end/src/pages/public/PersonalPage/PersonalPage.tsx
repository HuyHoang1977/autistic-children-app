import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useMyProfile,
  useUserProfile,
  useMyArticles,
  useUserArticles,
  useMyFollowing,
  useFollowingDoctors,
  useMyFollowers,
  useDoctorFollowers,
  useMyDashboard,
  useDashboard,
  useArticleStats,
  useFollowStats
} from '../../../hooks/api/usePersonal';
import { PersonalProfile } from '../../../api/services/personal.service';
import { useAuth } from '../../../hooks/auth/useAuth';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Skeleton } from '../../../components/ui/skeleton';

// Icons
import { Calendar, Mail, User, Edit, Users, BookOpen } from 'lucide-react';

// Components
import ProfileContent from './components/ProfileContent';
import ArticlesContent from './components/ArticlesContent';
import { FollowingContent, FollowersContent } from './components/FollowComponents';
import ProfileSkeleton from './components/ProfileSkeleton';

interface PersonalPageProps {
  userId?: number;
}

const PersonalPage: React.FC<PersonalPageProps> = ({ userId: propUserId }) => {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  // Determine which user we're viewing
  const userId = propUserId || (paramUserId ? parseInt(paramUserId) : undefined);
  const isMyProfile = !userId;

  // Always call all hooks unconditionally
  const myProfile = useMyProfile();
  const userProfile = useUserProfile(userId);
  const myArticles = useMyArticles(1, 10);
  const userArticles = useUserArticles(userId, 1, 10);
  const myFollowing = useMyFollowing(1, 10);
  const userFollowing = useFollowingDoctors(userId, 1, 10);
  const myFollowers = useMyFollowers(1, 10);
  const userFollowers = useDoctorFollowers(userId, 1, 10);
  const myDashboard = useMyDashboard();
  const userDashboard = useDashboard(userId);

  // Select data based on profile type
  const profile = isMyProfile ? myProfile.profile : userProfile.profile;
  const profileLoading = isMyProfile ? myProfile.loading : userProfile.loading;
  const profileError = isMyProfile ? myProfile.error : userProfile.error;
  const refetchProfile = isMyProfile ? myProfile.refetch : userProfile.refetch;

  const articles = isMyProfile ? myArticles.articles : userArticles.articles;
  const articlesPagination = isMyProfile ? myArticles.pagination : userArticles.pagination;
  const articlesLoading = isMyProfile ? myArticles.loading : userArticles.loading;
  const articlesError = isMyProfile ? myArticles.error : userArticles.error;
  const loadMoreArticles = isMyProfile ? myArticles.loadMore : userArticles.loadMore;
  const loadPreviousArticles = isMyProfile ? myArticles.loadPrevious : userArticles.loadPrevious;

  const following = isMyProfile ? myFollowing.doctors : userFollowing.doctors;
  const followingPagination = isMyProfile ? myFollowing.pagination : userFollowing.pagination;
  const followingLoading = isMyProfile ? myFollowing.loading : userFollowing.loading;
  const followingError = isMyProfile ? myFollowing.error : userFollowing.error;
  const loadMoreFollowing = isMyProfile ? myFollowing.loadMore : userFollowing.loadMore;
  const loadPreviousFollowing = isMyProfile ? myFollowing.loadPrevious : userFollowing.loadPrevious;

  const followers = isMyProfile ? myFollowers.followers : userFollowers.followers;
  const followersPagination = isMyProfile ? myFollowers.pagination : userFollowers.pagination;
  const followersLoading = isMyProfile ? myFollowers.loading : userFollowers.loading;
  const followersError = isMyProfile ? myFollowers.error : userFollowers.error;
  const loadMoreFollowers = isMyProfile ? myFollowers.loadMore : userFollowers.loadMore;
  const loadPreviousFollowers = isMyProfile ? myFollowers.loadPrevious : userFollowers.loadPrevious;

  const dashboard = isMyProfile ? myDashboard.dashboard : userDashboard.dashboard;
  const dashboardLoading = isMyProfile ? myDashboard.loading : userDashboard.loading;

  // Stats hooks
  const { stats: articleStats } = useArticleStats(userId);
  const { stats: followStats } = useFollowStats(userId);

  // Check if current user is viewing their own profile
  const isOwnProfile = currentUser && profile && currentUser.user_id === profile.user_id;

  // Debug logging
  console.log('PersonalPage Debug:', {
    userId,
    isMyProfile,
    profile: profile?.full_name,
    articles: articles?.length,
    articlesPagination: articlesPagination?.total,
    following: following?.length,
    followingPagination: followingPagination?.total,
    followers: followers?.length,
    followersPagination: followersPagination?.total,
    dashboard: dashboard?.article_stats,
    articlesError,
    followingError,
    followersError
  });

  if (profileLoading || dashboardLoading) {
    return <ProfileSkeleton />;
  }

  if (profileError) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">Lỗi: {profileError}</p>
            <Button onClick={refetchProfile} variant="outline">
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Không tìm thấy hồ sơ</h2>
            <p className="text-muted-foreground">Hồ sơ người dùng bạn tìm kiếm không tồn tại.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Profile Header */}
      <Card className="shadow-sm border">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar 
              className="w-24 h-24 border-2 border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
              onClick={() => navigate(`/personal/${profile.user_id}`)}
            >
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              <AvatarFallback className="text-xl bg-gray-200 text-gray-600">
                {profile.full_name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 md:mb-0">
                  {profile.full_name}
                </h1>
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Edit className="w-4 h-4" />
                    Sửa hồ sơ
                  </Button>
                )}
              </div>
              <p className="text-gray-600 mb-4 flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4" />
                {profile.email}
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                <Badge variant={profile.user_type === 'doctor' ? 'default' : 'secondary'}>
                  {profile.user_type === 'doctor' ? 'Bác sĩ' : 'Phụ huynh'}
                </Badge>
                {profile.user_type === 'doctor' && profile.doctor_info?.verified && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Đã xác thực
                  </Badge>
                )}
                <Badge variant="outline" className="text-gray-600">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(profile.created_at).toLocaleDateString('vi-VN')}
                </Badge>
              </div>

              {/* Basic Stats */}
              {dashboard && (
                <div className={`grid gap-4 mt-4 ${profile.user_type === 'parent' || profile.user_type === 'doctor' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {dashboard.article_stats.total_articles}
                    </div>
                    <div className="text-sm text-gray-600">Bài viết</div>
                  </div>
                  {profile.user_type === 'parent' && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {dashboard.follow_stats.total_following || 0}
                      </div>
                      <div className="text-sm text-gray-600">Đang theo dõi</div>
                    </div>
                  )}
                  {profile.user_type === 'doctor' && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {dashboard.follow_stats.total_followers || 0}
                      </div>
                      <div className="text-sm text-gray-600">Người theo dõi</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`grid w-full ${profile.user_type === 'parent' ? 'grid-cols-3' : profile.user_type === 'doctor' ? 'grid-cols-3' : 'grid-cols-2'} bg-gray-100`}>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Thông tin cá nhân
          </TabsTrigger>
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Bài viết ({articlesPagination?.total || articles?.length || 0})
          </TabsTrigger>
          {profile.user_type === 'parent' && (
            <TabsTrigger value="following" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Đang theo dõi ({followingPagination?.total || following?.length || 0})
            </TabsTrigger>
          )}
          {profile.user_type === 'doctor' && (
            <TabsTrigger value="followers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Người theo dõi ({followersPagination?.total || followers?.length || 0})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <ProfileContent 
            profile={profile} 
            articleStats={articleStats}
            followStats={followStats}
          />
        </TabsContent>

        {/* Articles Tab */}
        <TabsContent value="articles">
          <ArticlesContent 
            articles={articles || []}
            pagination={articlesPagination}
            loading={articlesLoading}
            error={articlesError}
            onLoadMore={loadMoreArticles}
            onLoadPrevious={loadPreviousArticles}
            navigate={navigate}
          />
        </TabsContent>

        {/* Following Tab */}
        {profile.user_type === 'parent' && (
          <TabsContent value="following">
            <FollowingContent 
              doctors={following || []}
              pagination={followingPagination}
              loading={followingLoading}
              error={followingError}
              onLoadMore={loadMoreFollowing}
              onLoadPrevious={loadPreviousFollowing}
              navigate={navigate}
            />
          </TabsContent>
        )}

        {/* Followers Tab */}
        {profile.user_type === 'doctor' && (
          <TabsContent value="followers">
            <FollowersContent 
              followers={followers || []}
              pagination={followersPagination}
              loading={followersLoading}
              error={followersError}
              onLoadMore={loadMoreFollowers}
              onLoadPrevious={loadPreviousFollowers}
              navigate={navigate}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default PersonalPage;