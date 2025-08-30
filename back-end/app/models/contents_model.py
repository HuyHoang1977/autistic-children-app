from app.extensions import db
from datetime import datetime


class Content(db.Model):
    __tablename__ = 'contents'

    content_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    author_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    content_type = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    view_count = db.Column(db.Integer, default=0)
    is_published = db.Column(db.Boolean, default=False)
    is_featured = db.Column(db.Boolean, default=False)

    # ✅ SAFE RELATIONSHIPS - No conflicts with Article model
    author = db.relationship('User', backref=db.backref('contents', lazy=True))

    # ✅ CRITICAL FIX: DO NOT create direct relationship to Article
    # Article accesses Content via content_id, not relationship
    # This avoids the 'content' name conflict completely

    # ✅ Comments relationship is handled by Comment model backref

    @property
    def articles(self):
        """Get articles that reference this content - SAFE property access"""
        try:
            from app.models.articles_model import Article
            return Article.query.filter_by(content_id=self.content_id).all()
        except:
            return []

    @property
    def articles_count(self):
        """Get count of articles referencing this content"""
        try:
            from app.models.articles_model import Article
            return Article.query.filter_by(content_id=self.content_id).count()
        except:
            return 0

    @property
    def comments(self):
        """Get comments for this content - SAFE property access"""
        try:
            from app.models.comments_model import Comment
            return Comment.query.filter_by(content_id=self.content_id).all()
        except:
            return []

    @property
    def comments_count(self):
        """Get count of comments for this content"""
        try:
            from app.models.comments_model import Comment
            return Comment.query.filter_by(content_id=self.content_id).count()
        except:
            return 0

    def to_dict(self):
        return {
            'content_id': self.content_id,
            'author_id': self.author_id,
            'title': self.title,
            'content_type': self.content_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'view_count': self.view_count,
            'is_published': self.is_published,
            'is_featured': self.is_featured,
            'articles_count': self.articles_count,
            'comments_count': self.comments_count
        }

    def __repr__(self):
        return f'<Content {self.content_id}: {self.title[:30]}...>'