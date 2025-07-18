from app.extensions import db
from datetime import datetime


class Article(db.Model):
    __tablename__ = 'articles'

    article_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    content_id = db.Column(db.Integer, db.ForeignKey('contents.content_id'), nullable=True)

    # Content fields
    title = db.Column(db.String(255), nullable=False, index=True)
    content = db.Column(db.Text, nullable=True)
    content_body = db.Column(db.Text, nullable=True)
    excerpt = db.Column(db.String(255), nullable=True)

    # Media fields
    featured_image = db.Column(db.String(255), nullable=True)
    featured_image_url = db.Column(db.String(255), nullable=True)
    media_attachments = db.Column(db.Text, nullable=True)

    # Author information
    author_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True, index=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    published_at = db.Column(db.DateTime, nullable=True, index=True)

    # Status and metadata
    status = db.Column(db.String(20), default='draft', nullable=False)
    article_status = db.Column(db.Integer, default=1, nullable=False)
    featured = db.Column(db.Boolean, default=False, nullable=False, index=True)

    # Legacy fields for backward compatibility
    category = db.Column(db.String(100), nullable=True, index=True)
    tags = db.Column(db.Text, nullable=True)

    slug = db.Column(db.String(255), unique=True, nullable=True, index=True)
    meta_description = db.Column(db.String(160), nullable=True)
    reading_time = db.Column(db.Integer, nullable=True)

    # Engagement metrics
    like_count = db.Column(db.Integer, default=0, nullable=False, index=True)
    likes = db.Column(db.Integer, default=0, nullable=False)
    comment_count = db.Column(db.Integer, default=0, nullable=False)
    share_count = db.Column(db.Integer, default=0, nullable=False)
    views = db.Column(db.Integer, default=0, nullable=False)

    # Settings
    allow_comments = db.Column(db.Boolean, default=True, nullable=False)

    # ✅ ADMIN MANAGEMENT FIELDS (These exist in your DB!)
    rejection_reason = db.Column(db.Text, nullable=True)
    admin_notes = db.Column(db.Text, nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    approval_priority = db.Column(db.Integer, nullable=True, default=0)
    submission_notes = db.Column(db.Text, nullable=True)
    review_deadline = db.Column(db.DateTime, nullable=True)
    auto_publish = db.Column(db.Boolean, default=False, nullable=False)
    version = db.Column(db.Integer, default=1, nullable=False)
    previous_version_id = db.Column(db.Integer, nullable=True)
    word_count = db.Column(db.Integer, nullable=True)
    readability_score = db.Column(db.Float, nullable=True)
    seo_score = db.Column(db.Float, nullable=True)
    total_read_time = db.Column(db.Integer, default=0, nullable=False)
    bounce_rate = db.Column(db.Float, nullable=True)
    conversion_rate = db.Column(db.Float, nullable=True)

    # ✅ CRITICAL FIX: ADD MISSING RELATIONSHIPS
    author = db.relationship('User', foreign_keys=[author_id], backref='authored_articles', lazy='select')
    reviewer = db.relationship('User', foreign_keys=[reviewed_by], lazy='select')

    # ✅ THESE ARE THE MISSING RELATIONSHIPS CAUSING THE ERROR!
    article_categories = db.relationship('ArticleCategory', back_populates='article',
                                         cascade='all, delete-orphan', lazy='select')
    article_tags = db.relationship('ArticleTag', back_populates='article',
                                   cascade='all, delete-orphan', lazy='select')

    def __init__(self, **kwargs):
        """Initialize Article with safe parameter handling"""
        # Remove any relationship fields that might cause conflicts
        relationship_fields = [
            'author', 'reviewer', 'content_obj', 'categories', 'tag_objects',
            'article_categories', 'article_tags', 'comments', 'saved_by'
        ]

        for field in relationship_fields:
            kwargs.pop(field, None)

        # Call parent constructor
        super().__init__(**kwargs)

        # Auto-generate slug if not provided
        if not self.slug and self.title:
            self.slug = self.generate_slug(self.title)

        # Auto-calculate reading time and word count
        if not self.reading_time and (self.content or self.content_body):
            content_text = self.content or self.content_body or ''
            self.reading_time = self.calculate_reading_time(content_text)
            self.word_count = self.calculate_word_count(content_text)

    # ✅ ADD MISSING PROPERTIES FOR CATEGORY AND TAG ACCESS
    @property
    def categories(self):
        """Get category objects from relationships"""
        try:
            return [ac.category for ac in self.article_categories if ac.category]
        except:
            return []

    @property
    def category_names(self):
        """Get list of category names"""
        try:
            names = [ac.category.name for ac in self.article_categories if ac.category]
            if not names and self.category:
                names = [self.category]
            return names
        except:
            return [self.category] if self.category else []

    @property
    def primary_category_name(self):
        """Get primary category name"""
        try:
            if self.article_categories and self.article_categories[0].category:
                return self.article_categories[0].category.name
        except:
            pass
        return self.category

    @property
    def tag_objects(self):
        """Get tag objects from relationships"""
        try:
            return [at.tag for at in self.article_tags if at.tag]
        except:
            return []

    @property
    def tag_names(self):
        """Get list of tag names"""
        try:
            names = [at.tag.name for at in self.article_tags if at.tag]
            if not names and self.tags:
                try:
                    import json
                    legacy_tags = json.loads(self.tags) if isinstance(self.tags, str) else []
                    if isinstance(legacy_tags, list):
                        names = legacy_tags
                    elif isinstance(legacy_tags, str):
                        names = [tag.strip() for tag in legacy_tags.split(',') if tag.strip()]
                except:
                    if isinstance(self.tags, str):
                        names = [tag.strip() for tag in self.tags.split(',') if tag.strip()]
            return names
        except:
            return []

    @staticmethod
    def generate_slug(title):
        """Generate URL-friendly slug from title"""
        import re
        import unicodedata

        if not title:
            return None

        try:
            # Convert to lowercase and normalize unicode
            slug = unicodedata.normalize('NFKD', title.lower())
            slug = slug.encode('ascii', 'ignore').decode('ascii')
            # Replace non-alphanumeric characters with hyphens
            slug = re.sub(r'[^a-z0-9]+', '-', slug)
            # Remove leading/trailing hyphens
            slug = slug.strip('-')
            return slug[:100] if slug else None
        except:
            # Fallback for any unicode issues
            slug = re.sub(r'[^a-zA-Z0-9\s]', '', title.lower())
            slug = re.sub(r'\s+', '-', slug)
            return slug[:100] if slug else None

    @staticmethod
    def calculate_reading_time(content):
        """Calculate estimated reading time in minutes"""
        if not content:
            return 0
        try:
            words_per_minute = 225
            word_count = len(content.split())
            reading_time = max(1, round(word_count / words_per_minute))
            return reading_time
        except:
            return 1

    @staticmethod
    def calculate_word_count(content):
        """Calculate word count"""
        if not content:
            return 0
        try:
            return len(content.split())
        except:
            return 0

    @property
    def id(self):
        """Alias for article_id to maintain frontend compatibility"""
        return self.article_id

    def sync_engagement_metrics(self):
        """Sync like_count and likes fields"""
        if self.like_count != self.likes:
            self.likes = self.like_count

    @property
    def is_pending_review(self):
        """Check if article is pending review"""
        return self.status == 'pending'

    @property
    def days_since_submission(self):
        """Get days since article was submitted for review"""
        if self.status != 'pending':
            return 0
        return (datetime.utcnow() - self.updated_at).days

    @property
    def review_status_display(self):
        """Get human-readable review status"""
        if self.status == 'published':
            return 'Đã xuất bản'
        elif self.status == 'pending':
            days = self.days_since_submission
            if days == 0:
                return 'Mới gửi hôm nay'
            elif days == 1:
                return 'Gửi từ 1 ngày trước'
            else:
                return f'Gửi từ {days} ngày trước'
        elif self.status == 'rejected':
            return 'Bị từ chối'
        elif self.status == 'draft':
            return 'Bản nháp'
        else:
            return self.status

    def to_dict(self, include_content=True, include_admin_fields=False):
        """Convert article to dictionary for JSON serialization"""
        self.sync_engagement_metrics()

        main_content = self.content or self.content_body or ''
        featured_img = self.featured_image_url or self.featured_image

        data = {
            'id': self.article_id,
            'article_id': self.article_id,
            'content_id': self.content_id,
            'title': self.title or '',
            'excerpt': self.excerpt,
            'author_id': self.author_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'status': self.status,
            'article_status': self.article_status,
            'featured': self.featured,

            # ✅ ENHANCED: Category and tags with both legacy and new data
            'category': self.primary_category_name,
            'categories': [cat.to_dict() for cat in self.categories],
            'category_names': self.category_names,
            'tags': self.tags,
            'tag_objects': [tag.to_dict() for tag in self.tag_objects],
            'tag_names': self.tag_names,

            'slug': self.slug,
            'meta_description': self.meta_description,
            'reading_time': self.reading_time,
            'word_count': self.word_count,
            'featured_image': featured_img,
            'featured_image_url': featured_img,
            'media_attachments': self.media_attachments,
            'allow_comments': self.allow_comments,

            # Engagement metrics
            'interactions': {
                'likes': self.likes or 0,
                'views': self.views or 0,
                'shares': self.share_count or 0,
                'comments_count': self.comment_count or 0
            },
            'like_count': self.like_count or 0,
            'likes': self.likes or 0,
            'comment_count': self.comment_count or 0,
            'share_count': self.share_count or 0,
            'views': self.views or 0,
            'total_read_time': self.total_read_time or 0,

            # Quality metrics
            'readability_score': self.readability_score,
            'seo_score': self.seo_score,

            # Status helpers
            'review_status_display': self.review_status_display,
            'days_since_submission': self.days_since_submission,

            'userInteractions': {
                'isLiked': False,
                'isSaved': False,
                'hasViewed': False
            }
        }

        # Include admin fields if requested
        if include_admin_fields:
            data.update({
                'rejection_reason': self.rejection_reason,
                'admin_notes': self.admin_notes,
                'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
                'reviewed_by': self.reviewed_by,
                'approval_priority': self.approval_priority or 0,
                'submission_notes': self.submission_notes,
                'review_deadline': self.review_deadline.isoformat() if self.review_deadline else None,
                'auto_publish': self.auto_publish,
                'version': self.version,
                'previous_version_id': self.previous_version_id,
                'bounce_rate': self.bounce_rate,
                'conversion_rate': self.conversion_rate,
            })

            # Add reviewer info if available
            try:
                if self.reviewer:
                    data['reviewer'] = {
                        'id': self.reviewer.user_id,
                        'username': self.reviewer.username,
                        'full_name': self.reviewer.full_name,
                        'avatar_url': getattr(self.reviewer, 'avatar_url', None)
                    }
            except:
                pass

        if include_content:
            data['content'] = main_content
            data['content_body'] = self.content_body

        try:
            if self.author:
                data['author'] = {
                    'id': self.author.user_id,
                    'username': self.author.username,
                    'full_name': self.author.full_name,
                    'avatar_url': getattr(self.author, 'avatar_url', None)
                }
        except:
            pass

        return data

    def update_engagement(self, likes_delta=0, views_delta=0, shares_delta=0, comments_delta=0, read_time_delta=0):
        """Update engagement metrics"""
        if likes_delta:
            self.like_count = (self.like_count or 0) + likes_delta
            self.likes = self.like_count
        if views_delta:
            self.views = (self.views or 0) + views_delta
        if shares_delta:
            self.share_count = (self.share_count or 0) + shares_delta
        if comments_delta:
            self.comment_count = (self.comment_count or 0) + comments_delta
        if read_time_delta:
            self.total_read_time = (self.total_read_time or 0) + read_time_delta

        # Ensure non-negative values
        self.like_count = max(0, self.like_count or 0)
        self.likes = self.like_count
        self.views = max(0, self.views or 0)
        self.share_count = max(0, self.share_count or 0)
        self.comment_count = max(0, self.comment_count or 0)
        self.total_read_time = max(0, self.total_read_time or 0)

    def submit_for_review(self, submission_notes=None):
        """Submit article for admin review"""
        if self.status in ['draft', 'rejected']:
            self.status = 'pending'
            self.article_status = 1
            self.updated_at = datetime.utcnow()

            if submission_notes:
                self.submission_notes = submission_notes

            # Clear previous rejection data
            self.rejection_reason = None
            self.admin_notes = None

            # Set review deadline (3 business days)
            from datetime import timedelta
            self.review_deadline = datetime.utcnow() + timedelta(days=3)

            return True
        return False

    def approve_article(self, admin_user_id, admin_notes=None, auto_publish=True):
        """Approve article (admin action)"""
        if self.status == 'pending':
            self.reviewed_by = admin_user_id
            self.reviewed_at = datetime.utcnow()
            self.admin_notes = admin_notes

            if auto_publish:
                self.publish()
            else:
                self.status = 'approved'
                self.article_status = 1

            # Clear rejection data
            self.rejection_reason = None
            self.review_deadline = None

            return True
        return False

    def reject_article(self, admin_user_id, rejection_reason, admin_notes=None):
        """Reject article (admin action)"""
        if self.status == 'pending':
            self.status = 'rejected'
            self.article_status = 0
            self.reviewed_by = admin_user_id
            self.reviewed_at = datetime.utcnow()
            self.rejection_reason = rejection_reason
            self.admin_notes = admin_notes
            self.review_deadline = None

            return True
        return False

    def publish(self):
        """Publish the article"""
        self.status = 'published'
        self.article_status = 2
        self.published_at = datetime.utcnow()

    def unpublish(self):
        """Unpublish the article"""
        self.status = 'draft'
        self.article_status = 1
        self.published_at = None

    def archive(self):
        """Archive the article"""
        self.status = 'archived'
        self.article_status = 3

    # Class methods for queries - ENHANCED with relationship support
    @classmethod
    def get_published(cls):
        """Get all published articles"""
        return cls.query.filter(
            db.or_(cls.status == 'published', cls.article_status == 2)
        ).order_by(cls.published_at.desc())

    @classmethod
    def get_featured(cls):
        """Get all featured published articles"""
        return cls.query.filter(
            db.and_(
                db.or_(cls.status == 'published', cls.article_status == 2),
                cls.featured == True
            )
        ).order_by(cls.published_at.desc())

    @classmethod
    def get_pending_review(cls):
        """Get all articles pending review"""
        return cls.query.filter(cls.status == 'pending').order_by(cls.updated_at.asc())

    @classmethod
    def get_by_author(cls, author_id, status=None):
        """Get articles by author"""
        query = cls.query.filter(cls.author_id == author_id)
        if status:
            query = query.filter(cls.status == status)
        return query.order_by(cls.updated_at.desc())

    @classmethod
    def get_by_category(cls, category_name):
        """Get published articles by category name (supports both legacy and relationships)"""
        try:
            from app.models.categories_model import Category
            from app.models.article_categories_model import ArticleCategory

            return cls.query.outerjoin(ArticleCategory).outerjoin(Category).filter(
                db.and_(
                    db.or_(cls.status == 'published', cls.article_status == 2),
                    db.or_(
                        db.and_(Category.name == category_name, Category.is_active == True),
                        cls.category == category_name  # Fallback to legacy field
                    )
                )
            ).order_by(cls.published_at.desc())
        except ImportError:
            # Fallback to legacy field only
            return cls.query.filter(
                db.and_(
                    db.or_(cls.status == 'published', cls.article_status == 2),
                    cls.category == category_name
                )
            ).order_by(cls.published_at.desc())

    @classmethod
    def search(cls, query, status='published'):
        """Search articles by title and content"""
        search_term = f"%{query}%"
        base_query = cls.query

        if status:
            if status == 'published':
                base_query = base_query.filter(
                    db.or_(cls.status == 'published', cls.article_status == 2)
                )
            else:
                base_query = base_query.filter(cls.status == status)

        return base_query.filter(
            db.or_(
                cls.title.ilike(search_term),
                cls.content.ilike(search_term),
                cls.content_body.ilike(search_term),
                cls.excerpt.ilike(search_term),
                cls.category.ilike(search_term),
                cls.tags.ilike(search_term)
            )
        ).order_by(cls.published_at.desc() if status == 'published' else cls.updated_at.desc())

    def __repr__(self):
        return f'<Article {self.article_id}: {self.title[:30] if self.title else "No title"}...>'