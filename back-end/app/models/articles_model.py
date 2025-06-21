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
    media_attachments = db.Column(db.Text, nullable=True)  # JSON string for multiple attachments

    # Author information
    author_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True, index=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    published_at = db.Column(db.DateTime, nullable=True, index=True)

    # Status and metadata
    status = db.Column(db.String(20), default='draft', nullable=False)  # 'draft', 'published', 'archived'
    article_status = db.Column(db.Integer, default=1, nullable=False)  # 1: draft, 2: published, 3: archived
    featured = db.Column(db.Boolean, default=False, nullable=False, index=True)
    category = db.Column(db.String(100), nullable=True, index=True)
    tags = db.Column(db.Text, nullable=True)  # JSON string of tags
    slug = db.Column(db.String(255), unique=True, nullable=True, index=True)
    meta_description = db.Column(db.String(160), nullable=True)
    reading_time = db.Column(db.Integer, nullable=True)

    # Engagement metrics
    like_count = db.Column(db.Integer, default=0, nullable=False, index=True)
    likes = db.Column(db.Integer, default=0, nullable=False)  # Alias for compatibility
    comment_count = db.Column(db.Integer, default=0, nullable=False)
    share_count = db.Column(db.Integer, default=0, nullable=False)
    views = db.Column(db.Integer, default=0, nullable=False)

    # Settings
    allow_comments = db.Column(db.Boolean, default=True, nullable=False)

    # Relationships
    content = db.relationship('Content', back_populates='articles', lazy='select')
    author = db.relationship('User', backref='articles', lazy='select')
    article_categories = db.relationship('ArticleCategory', back_populates='article', cascade='all, delete-orphan')
    article_tags = db.relationship('ArticleTag', back_populates='article', cascade='all, delete-orphan')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Sync like_count and likes
        if 'like_count' in kwargs and 'likes' not in kwargs:
            self.likes = kwargs['like_count']
        elif 'likes' in kwargs and 'like_count' not in kwargs:
            self.like_count = kwargs['likes']

        if not self.slug and self.title:
            self.slug = self.generate_slug(self.title)
        if not self.reading_time and (self.content or self.content_body):
            content_text = self.content or self.content_body or ''
            self.reading_time = self.calculate_reading_time(content_text)

    def __repr__(self):
        return f'<Article {self.article_id}: {self.title[:30] if self.title else "No title"}...>'

    @staticmethod
    def generate_slug(title):
        """Generate URL-friendly slug from title"""
        import re
        import unicodedata

        if not title:
            return None

        # Convert to lowercase and remove accents
        slug = unicodedata.normalize('NFKD', title.lower())
        slug = slug.encode('ascii', 'ignore').decode('ascii')

        # Replace spaces and special characters with hyphens
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        slug = slug.strip('-')

        return slug[:100] if slug else None  # Limit length

    @staticmethod
    def calculate_reading_time(content):
        """Calculate estimated reading time in minutes"""
        if not content:
            return 0

        # Average reading speed: 200-250 words per minute
        words_per_minute = 225
        word_count = len(content.split())
        reading_time = max(1, round(word_count / words_per_minute))

        return reading_time

    @property
    def id(self):
        """Alias for article_id to maintain frontend compatibility"""
        return self.article_id

    def sync_engagement_metrics(self):
        """Sync like_count and likes fields"""
        if self.like_count != self.likes:
            self.likes = self.like_count

    def to_dict(self, include_content=True):
        """Convert article to dictionary for JSON serialization"""
        # Ensure engagement metrics are synced
        self.sync_engagement_metrics()

        # Get main content (prefer content over content_body)
        main_content = self.content or self.content_body or ''

        # Get featured image (prefer featured_image_url over featured_image)
        featured_img = self.featured_image_url or self.featured_image

        data = {
            'id': self.article_id,  # Frontend expects 'id'
            'article_id': self.article_id,  # Backend compatibility
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
            'category': self.category,
            'tags': self.tags,
            'slug': self.slug,
            'meta_description': self.meta_description,
            'reading_time': self.reading_time,
            'featured_image': featured_img,
            'featured_image_url': featured_img,  # Alias
            'media_attachments': self.media_attachments,
            'allow_comments': self.allow_comments,

            # Engagement metrics (provide both naming conventions)
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

            # User interactions (to be populated by service layer)
            'userInteractions': {
                'isLiked': False,
                'isSaved': False,
                'hasViewed': False
            }
        }

        # Include content only if requested (for performance)
        if include_content:
            data['content'] = main_content
            data['content_body'] = self.content_body  # Backend compatibility

        # Include author information if available
        if self.author:
            data['author'] = {
                'id': self.author.user_id,
                'username': self.author.username,
                'full_name': self.author.full_name,
                'avatar_url': getattr(self.author, 'avatar_url', None)
            }

        return data

    def update_engagement(self, likes_delta=0, views_delta=0, shares_delta=0, comments_delta=0):
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

        # Ensure no negative values
        self.like_count = max(0, self.like_count or 0)
        self.likes = self.like_count
        self.views = max(0, self.views or 0)
        self.share_count = max(0, self.share_count or 0)
        self.comment_count = max(0, self.comment_count or 0)

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
    def get_by_category(cls, category):
        """Get published articles by category"""
        return cls.query.filter(
            db.and_(
                db.or_(cls.status == 'published', cls.article_status == 2),
                cls.category == category
            )
        ).order_by(cls.published_at.desc())

    @classmethod
    def search(cls, query):
        """Search articles by title and content"""
        search_term = f"%{query}%"
        return cls.query.filter(
            db.and_(
                db.or_(cls.status == 'published', cls.article_status == 2),
                db.or_(
                    cls.title.ilike(search_term),
                    cls.content.ilike(search_term),
                    cls.content_body.ilike(search_term),
                    cls.excerpt.ilike(search_term)
                )
            )
        ).order_by(cls.published_at.desc())