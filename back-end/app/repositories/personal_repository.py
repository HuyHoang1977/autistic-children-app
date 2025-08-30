from app.repositories.base_repository import BaseRepository
from app.models.users_model import User
from app.models.doctors_model import Doctor
from app.models.parents_model import Parent
from app.models.articles_model import Article
from app.models.doctor_follows_model import DoctorFollow
from app.models.childs_model import Child
from app.extensions import db
from sqlalchemy.orm import joinedload
from sqlalchemy import desc
from datetime import date


class PersonalRepository(BaseRepository):
    def __init__(self):
        super().__init__(User)
    
    def get_user_personal_info(self, user_id):
        """
        Lấy thông tin cá nhân của user (parent/doctor)
        """
        try:
            user = self.model.query.options(
                joinedload(User.doctor),
                joinedload(User.parent),
                joinedload(User.role)
            ).filter_by(user_id=user_id).first()
            
            if not user:
                return None
            
            # Thông tin cơ bản của user
            user_info = user.to_dict()
            
            # Lấy thông tin chi tiết theo role
            if user.doctor:
                user_info['doctor_info'] = user.doctor.to_dict()
                user_info['user_type'] = 'doctor'
            elif user.parent:
                user_info['parent_info'] = user.parent.to_dict()
                user_info['user_type'] = 'parent'
                
                # Lấy thông tin children nếu là parent
                children = Child.query.filter_by(parent_id=user.parent.parent_id).all()
                children_with_age = []
                for child in children:
                    child_info = child.to_dict()
                    # Tính tuổi
                    if child.birth_date:
                        today = date.today()
                        age = today.year - child.birth_date.year
                        if today.month < child.birth_date.month or (today.month == child.birth_date.month and today.day < child.birth_date.day):
                            age -= 1
                        child_info['age'] = age
                    children_with_age.append(child_info)
                
                user_info['children'] = children_with_age
                user_info['children_count'] = len(children_with_age)
            
            # Lấy thông tin role
            if user.role:
                user_info['role'] = user.role.to_dict()
            
            return user_info
            
        except Exception as e:
            raise e
    
    def get_user_articles(self, user_id, page=1, per_page=10):
        """
        Lấy danh sách các bài viết của user
        """
        try:
            query = Article.query.filter_by(author_id=user_id).order_by(desc(Article.created_at))
            
            # Phân trang
            articles = query.paginate(page=page, per_page=per_page, error_out=False)
            
            return {
                'data': [article.to_dict() for article in articles.items],
                'total': articles.total,
                'pages': articles.pages,
                'current_page': articles.page,
                'has_next': articles.has_next,
                'has_prev': articles.has_prev
            }
            
        except Exception as e:
            raise e
    
    def get_user_article_stats(self, user_id):
        """
        Lấy thống kê bài viết của user
        """
        try:
            total_articles = Article.query.filter_by(author_id=user_id).count()
            published_articles = Article.query.filter_by(author_id=user_id, status='published').count()
            
            return {
                'total_articles': total_articles,
                'published_articles': published_articles,
                'draft_articles': total_articles - published_articles
            }
            
        except Exception as e:
            raise e
    
    def get_parent_following_doctors(self, user_id, page=1, per_page=10):
        """
        Lấy danh sách bác sĩ mà parent đang follow
        """
        try:
            user = User.query.filter_by(user_id=user_id).first()
            if not user or not user.parent:
                return {'error': 'User is not a parent'}
            
            # Lấy danh sách doctor follows
            query = db.session.query(DoctorFollow).options(
                joinedload(DoctorFollow.doctor).joinedload(Doctor.user)
            ).filter_by(
                parent_id=user.parent.parent_id,
                is_active=True
            ).order_by(desc(DoctorFollow.followed_at))
            
            follows = query.paginate(page=page, per_page=per_page, error_out=False)
            
            following_doctors = []
            for follow in follows.items:
                doctor_info = follow.doctor.to_dict()
                doctor_info['user_info'] = follow.doctor.user.to_dict()
                doctor_info['followed_at'] = follow.followed_at.isoformat()
                following_doctors.append(doctor_info)
            
            return {
                'data': following_doctors,
                'total': follows.total,
                'pages': follows.pages,
                'current_page': follows.page,
                'has_next': follows.has_next,
                'has_prev': follows.has_prev
            }
            
        except Exception as e:
            raise e
    
    def get_doctor_followers(self, user_id, page=1, per_page=10):
        """
        Lấy danh sách parent đang follow doctor
        """
        try:
            user = User.query.filter_by(user_id=user_id).first()
            if not user or not user.doctor:
                return {'error': 'User is not a doctor'}
            
            # Lấy danh sách followers
            query = db.session.query(DoctorFollow).options(
                joinedload(DoctorFollow.parent).joinedload(Parent.user)
            ).filter_by(
                doctor_id=user.doctor.doctor_id,
                is_active=True
            ).order_by(desc(DoctorFollow.followed_at))
            
            follows = query.paginate(page=page, per_page=per_page, error_out=False)
            
            followers = []
            for follow in follows.items:
                parent_info = follow.parent.to_dict()
                parent_info['user_info'] = follow.parent.user.to_dict()
                parent_info['followed_at'] = follow.followed_at.isoformat()
                
                # Lấy thông tin children của parent
                children = Child.query.filter_by(parent_id=follow.parent.parent_id).all()
                children_with_age = []
                for child in children:
                    child_info = child.to_dict()
                    if child.birth_date:
                        today = date.today()
                        age = today.year - child.birth_date.year
                        if today.month < child.birth_date.month or (today.month == child.birth_date.month and today.day < child.birth_date.day):
                            age -= 1
                        child_info['age'] = age
                    children_with_age.append(child_info)
                
                parent_info['children'] = children_with_age
                parent_info['children_count'] = len(children_with_age)
                followers.append(parent_info)
            
            return {
                'data': followers,
                'total': follows.total,
                'pages': follows.pages,
                'current_page': follows.page,
                'has_next': follows.has_next,
                'has_prev': follows.has_prev
            }
            
        except Exception as e:
            raise e
    
    def get_follow_stats(self, user_id):
        """
        Lấy thống kê follow theo role của user
        """
        try:
            user = User.query.filter_by(user_id=user_id).first()
            if not user:
                return {'error': 'User not found'}
            
            if user.parent:
                # Thống kê cho parent
                total_following = DoctorFollow.query.filter_by(
                    parent_id=user.parent.parent_id,
                    is_active=True
                ).count()
                
                return {
                    'user_type': 'parent',
                    'total_following': total_following
                }
                
            elif user.doctor:
                # Thống kê cho doctor
                total_followers = DoctorFollow.query.filter_by(
                    doctor_id=user.doctor.doctor_id,
                    is_active=True
                ).count()
                
                return {
                    'user_type': 'doctor',
                    'total_followers': total_followers
                }
            
            return {'error': 'User role not supported'}
            
        except Exception as e:
            raise e