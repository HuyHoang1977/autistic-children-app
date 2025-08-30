from app.repositories.personal_repository import PersonalRepository
import logging

logger = logging.getLogger(__name__)


class PersonalService:
    def __init__(self):
        self.personal_repository = PersonalRepository()
    
    def get_user_profile(self, user_id):
        """
        Lấy thông tin profile của user
        """
        try:
            if not user_id:
                return {
                    'success': False,
                    'message': 'User ID is required',
                    'data': None
                }
            
            profile_data = self.personal_repository.get_user_personal_info(user_id)
            
            if not profile_data:
                return {
                    'success': False,
                    'message': 'User not found',
                    'data': None
                }
            
            return {
                'success': True,
                'message': 'User profile retrieved successfully',
                'data': profile_data
            }
            
        except Exception as e:
            logger.error(f"Error getting user profile: {str(e)}")
            return {
                'success': False,
                'message': 'An error occurred while retrieving user profile',
                'data': None
            }
    
    def get_user_articles(self, user_id, page=1, per_page=10):
        """
        Lấy danh sách bài viết của user
        """
        try:
            if not user_id:
                return {
                    'success': False,
                    'message': 'User ID is required',
                    'data': None
                }
            
            # Validate pagination
            if page < 1:
                page = 1
            if per_page < 1 or per_page > 50:
                per_page = 10
            
            articles_data = self.personal_repository.get_user_articles(
                user_id=user_id,
                page=page,
                per_page=per_page
            )
            
            # Debug logging
            logger.info(f"Articles data for user {user_id}: {articles_data}")
            
            return {
                'success': True,
                'message': 'Articles retrieved successfully',
                'data': articles_data
            }
            
        except Exception as e:
            logger.error(f"Error getting user articles: {str(e)}")
            return {
                'success': False,
                'message': 'An error occurred while retrieving articles',
                'data': None
            }
    
    def get_article_statistics(self, user_id):
        """
        Lấy thống kê bài viết của user
        """
        try:
            if not user_id:
                return {
                    'success': False,
                    'message': 'User ID is required',
                    'data': None
                }
            
            stats = self.personal_repository.get_user_article_stats(user_id)
            
            return {
                'success': True,
                'message': 'Article statistics retrieved successfully',
                'data': stats
            }
            
        except Exception as e:
            logger.error(f"Error getting article statistics: {str(e)}")
            return {
                'success': False,
                'message': 'An error occurred while retrieving article statistics',
                'data': None
            }
    
    def get_following_doctors(self, user_id, page=1, per_page=10):
        """
        Lấy danh sách bác sĩ mà parent đang follow
        """
        try:
            if not user_id:
                return {
                    'success': False,
                    'message': 'User ID is required',
                    'data': None
                }
            
            # Validate pagination
            if page < 1:
                page = 1
            if per_page < 1 or per_page > 50:
                per_page = 10
            
            result = self.personal_repository.get_parent_following_doctors(
                user_id=user_id,
                page=page,
                per_page=per_page
            )
            
            if 'error' in result:
                return {
                    'success': False,
                    'message': result['error'],
                    'data': None
                }
            
            return {
                'success': True,
                'message': 'Following doctors retrieved successfully',
                'data': result
            }
            
        except Exception as e:
            logger.error(f"Error getting following doctors: {str(e)}")
            return {
                'success': False,
                'message': 'An error occurred while retrieving following doctors',
                'data': None
            }
    
    def get_doctor_followers(self, user_id, page=1, per_page=10):
        """
        Lấy danh sách parent đang follow doctor
        """
        try:
            if not user_id:
                return {
                    'success': False,
                    'message': 'User ID is required',
                    'data': None
                }
            
            # Validate pagination
            if page < 1:
                page = 1
            if per_page < 1 or per_page > 50:
                per_page = 10
            
            result = self.personal_repository.get_doctor_followers(
                user_id=user_id,
                page=page,
                per_page=per_page
            )
            
            # Debug logging
            logger.info(f"Followers data for user {user_id}: {result}")
            
            if 'error' in result:
                return {
                    'success': False,
                    'message': result['error'],
                    'data': None
                }
            
            return {
                'success': True,
                'message': 'Doctor followers retrieved successfully',
                'data': result
            }
            
        except Exception as e:
            logger.error(f"Error getting doctor followers: {str(e)}")
            return {
                'success': False,
                'message': 'An error occurred while retrieving doctor followers',
                'data': None
            }
    
    def get_follow_statistics(self, user_id):
        """
        Lấy thống kê follow theo role
        """
        try:
            if not user_id:
                return {
                    'success': False,
                    'message': 'User ID is required',
                    'data': None
                }
            
            stats = self.personal_repository.get_follow_stats(user_id)
            
            if 'error' in stats:
                return {
                    'success': False,
                    'message': stats['error'],
                    'data': None
                }
            
            return {
                'success': True,
                'message': 'Follow statistics retrieved successfully',
                'data': stats
            }
            
        except Exception as e:
            logger.error(f"Error getting follow statistics: {str(e)}")
            return {
                'success': False,
                'message': 'An error occurred while retrieving follow statistics',
                'data': None
            }
    
    def get_dashboard_summary(self, user_id):
        """
        Lấy tổng quan dashboard cho user
        """
        try:
            if not user_id:
                return {
                    'success': False,
                    'message': 'User ID is required',
                    'data': None
                }
            
            # Lấy thông tin cá nhân
            profile = self.personal_repository.get_user_personal_info(user_id)
            if not profile:
                return {
                    'success': False,
                    'message': 'User not found',
                    'data': None
                }
            
            # Lấy thống kê bài viết
            article_stats = self.personal_repository.get_user_article_stats(user_id)
            
            # Lấy thống kê follow
            follow_stats = self.personal_repository.get_follow_stats(user_id)
            
            dashboard_data = {
                'user_info': profile,
                'article_stats': article_stats,
                'follow_stats': follow_stats if 'error' not in follow_stats else {}
            }
            
            return {
                'success': True,
                'message': 'Dashboard summary retrieved successfully',
                'data': dashboard_data
            }
            
        except Exception as e:
            logger.error(f"Error getting dashboard summary: {str(e)}")
            return {
                'success': False,
                'message': 'An error occurred while retrieving dashboard summary',
                'data': None
            }