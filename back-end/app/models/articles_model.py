from app.extensions import db
from datetime import datetime


class Article(db.Model):
    __tablename__ = 'articles'

    article_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    content_id = db.Column(db.Integer, db.ForeignKey('contents.content_id'), nullable=True)

    # Content fields
    title = db.Column(db.String(255), nullable=False, index=True)
    content = db.Column(db.Text, nullable=True)  # This is the COLUMN
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

    # ✅ Legacy fields for backward compatibility (keep these!)
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

    # ✅ RELATIONSHIPS - FIXED: Rename to avoid conflicts
    # CRITICAL FIX: 'content' is both a column and relationship name - this causes the conflict!
    # Rename relationship to avoid collision with 'content' column
    content_obj = db.relationship('Content', back_populates='articles', lazy='select')
    author = db.relationship('User', backref='articles', lazy='select')

    # These are also potential conflicts, so rename them too
    article_categories = db.relationship('ArticleCategory', back_populates='article', cascade='all, delete-orphan',
                                         lazy='select')
    article_tags = db.relationship('ArticleTag', back_populates='article', cascade='all, delete-orphan', lazy='select')

    def __init__(self, **kwargs):
        """
        ✅ FINAL FIX: Remove the relationship name conflicts
        """
        # ✅ Extract the problematic fields
        category_name = kwargs.pop('category', None)
        tags_string = kwargs.pop('tags', None)

        # ✅ CRITICAL: Remove any field that might be interpreted as relationship
        relationship_fields = [
            'content_obj', 'author_obj', 'categories', 'tag_objects',
            'article_categories', 'article_tags', 'author', 'comments',
            'saved_by', 'relationships'
        ]

        for field in relationship_fields:
            kwargs.pop(field, None)

        # ✅ Call parent with remaining kwargs (should be safe now)
        super().__init__(**kwargs)

        # ✅ Set legacy fields manually AFTER parent init
        if category_name:
            self.category = category_name
        if tags_string:
            self.tags = tags_string

        # ✅ Simple computed fields
        if not self.slug and self.title:
            self.slug = self.generate_slug(self.title)
        if not self.reading_time and (self.content or self.content_body):
            content_text = self.content or self.content_body or ''
            self.reading_time = self.calculate_reading_time(content_text)

    @property
    def categories(self):
        """Get all category objects from relationships"""
        try:
            return [ac.category for ac in self.article_categories if ac.category]
        except:
            return []

    @property
    def category_names(self):
        """Get list of category names from relationships"""
        try:
            names = [ac.category.name for ac in self.article_categories if ac.category]
            # Fallback to legacy field if no relationships
            if not names and self.category:
                names = [self.category]
            return names
        except:
            return [self.category] if self.category else []

    @property
    def primary_category_name(self):
        """Get primary category name (first one or legacy field)"""
        try:
            if self.article_categories and self.article_categories[0].category:
                return self.article_categories[0].category.name
        except:
            pass
        return self.category

    @property
    def tag_objects(self):
        """Get all tag objects from relationships"""
        try:
            return [at.tag for at in self.article_tags if at.tag]
        except:
            return []

    @property
    def tag_names(self):
        """Get list of tag names from relationships"""
        try:
            names = [at.tag.name for at in self.article_tags if at.tag]
            # Fallback to legacy field if no relationships
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

    def __repr__(self):
        return f'<Article {self.article_id}: {self.title[:30] if self.title else "No title"}...>'

    @staticmethod
    def generate_slug(title):
        """Generate URL-friendly slug from title"""
        import re
        import unicodedata

        if not title:
            return None

        try:
            slug = unicodedata.normalize('NFKD', title.lower())
            slug = slug.encode('ascii', 'ignore').decode('ascii')
            slug = re.sub(r'[^a-z0-9]+', '-', slug)
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

            # ✅ Category data (both legacy and new)
            'category': self.primary_category_name,
            'categories': [cat.to_dict() for cat in self.categories],
            'category_names': self.category_names,

            # ✅ Tag data (both legacy and new)
            'tags': self.tags,
            'tag_objects': [tag.to_dict() for tag in self.tag_objects],
            'tag_names': self.tag_names,

            'slug': self.slug,
            'meta_description': self.meta_description,
            'reading_time': self.reading_time,
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

            'userInteractions': {
                'isLiked': False,
                'isSaved': False,
                'hasViewed': False
            }
        }

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
                    cls.excerpt.ilike(search_term),
                    cls.category.ilike(search_term),
                    cls.tags.ilike(search_term)
                )
            )
        ).order_by(cls.published_at.desc())