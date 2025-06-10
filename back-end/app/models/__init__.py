# Import all models to ensure they are registered with SQLAlchemy
from .users_model import User
from .roles_model import Role
from .admins_model import Admin
from .parents_model import Parent
from .doctors_model import Doctor
from .childs_model import Child
from .contents_model import Content
from .articles_model import Article
from .categories_model import Category
from .comments_model import Comment
from .tags_model import Tag
from .article_categories_model import ArticleCategory
from .article_tags_model import ArticleTag
from .appointments_model import Appointment
from .medical_records_model import MedicalRecord
from .messages_model import Message
from .notifications_model import Notification
from .favorites_model import Favorite
from .saved_articles_model import SavedArticle
from .doctor_follows_model import DoctorFollow
from .doctor_specializations_model import DoctorSpecialization

__all__ = [
    'User', 'Role', 'Admin', 'Parent', 'Doctor', 'Child', 
    'Content', 'Article', 'Category', 'Comment', 'Tag',
    'ArticleCategory', 'ArticleTag', 'Appointment', 'MedicalRecord',
    'Message', 'Notification', 'Favorite', 'SavedArticle',
    'DoctorFollow', 'DoctorSpecialization'
]
