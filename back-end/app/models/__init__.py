# ✅ STEP 1: Import base models first (no foreign keys)
from .roles_model import Role

# ✅ STEP 2: Import User model (depends on Role)
from .users_model import User

# ✅ STEP 3: Import role-specific models (depend on User and Role)
from .admins_model import Admin
from .doctors_model import Doctor
from .parents_model import Parent

# ✅ STEP 4: Import child model (depends on Parent)
try:
    from .childs_model import Child
except ImportError:
    pass

# ✅ STEP 5: Import content structure models
from .categories_model import Category
from .tags_model import Tag
from .contents_model import Content

# ✅ STEP 6: Import main content model (Articles)
from .articles_model import Article

# ✅ STEP 7: Import relationship models (depend on main models)
from .article_categories_model import ArticleCategory
from .article_tags_model import ArticleTag

# ✅ STEP 8: Import interaction models
try:
    from .comments_model import Comment
except ImportError:
    pass

try:
    from .saved_articles_model import SavedArticle
except ImportError:
    pass

try:
    from .favorites_model import Favorite
except ImportError:
    pass

# ✅ STEP 9: Import other optional models
try:
    from .appointments_model import Appointment
except ImportError:
    pass

try:
    from .medical_records_model import MedicalRecord
except ImportError:
    pass

try:
    from .messages_model import Message
except ImportError:
    pass

try:
    from .notifications_model import Notification
except ImportError:
    pass

try:
    from .doctor_follows_model import DoctorFollow
except ImportError:
    pass

try:
    from .doctor_specializations_model import DoctorSpecialization
except ImportError:
    pass

# ✅ Export essential models for easy import
__all__ = [
    'Role',
    'User',
    'Admin',
    'Doctor',
    'Parent',
    'Category',
    'Tag',
    'Content',
    'Article',
    'ArticleCategory',
    'ArticleTag',
    'Comment',
    'SavedArticle',
    'Favorite',
    'Child',
    'Appointment',
    'MedicalRecord',
    'Message',
    'Notification',
    'DoctorFollow',
    'DoctorSpecialization'
]