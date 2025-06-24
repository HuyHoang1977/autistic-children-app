from app.extensions import db
from datetime import datetime


class Tag(db.Model):
    __tablename__ = 'tags'

    tag_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, unique=True, index=True)
    description = db.Column(db.String(255))
    color = db.Column(db.String(10))  # Hex color code
    usage_count = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)  # Added for router compatibility
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)  # Added

    # Relationships
    article_tags = db.relationship('ArticleTag', back_populates='tag', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Tag {self.tag_id}: {self.name}>'

    @property
    def articles(self):
        """Get all articles with this tag"""
        return [at.article for at in self.article_tags if at.article]

    @property
    def articles_count(self):
        """Get count of articles with this tag"""
        return len(self.article_tags)

    def increment_usage(self):
        """Increment usage count when tag is used"""
        self.usage_count = (self.usage_count or 0) + 1

    def decrement_usage(self):
        """Decrement usage count when tag is removed"""
        self.usage_count = max(0, (self.usage_count or 0) - 1)

    def to_dict(self):
        return {
            'tag_id': self.tag_id,
            'name': self.name,
            'description': self.description,
            'color': self.color,
            'usage_count': self.usage_count,
            'is_active': self.is_active,
            'articles_count': self.articles_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @classmethod
    def get_popular_tags(cls, limit=10):
        """Get most popular tags by usage count"""
        return cls.query.filter_by(is_active=True).order_by(
            cls.usage_count.desc()
        ).limit(limit).all()

    @classmethod
    def search_tags(cls, query):
        """Search tags by name"""
        search_term = f"%{query}%"
        return cls.query.filter(
            db.and_(
                cls.is_active == True,
                cls.name.ilike(search_term)
            )
        ).order_by(cls.usage_count.desc()).all()

    @classmethod
    def get_or_create(cls, name, description=None, color=None):
        """Get existing tag or create new one"""
        tag = cls.query.filter_by(name=name.strip()).first()
        if not tag:
            tag = cls(
                name=name.strip(),
                description=description or f"Auto-created tag: {name}",
                color=color,
                is_active=True
            )
            db.session.add(tag)
            db.session.flush()  # Get the ID
        return tag