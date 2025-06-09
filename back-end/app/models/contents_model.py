from app.extensions import db
from datetime import datetime


class Content(db.Model):
    __tablename__ = 'contents'

    content_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    author_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    content_type = db.Column(db.Integer, nullable=False)  # 1: article, 2: video, 3: tip
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    view_count = db.Column(db.Integer, default=0)
    is_published = db.Column(db.Boolean, default=False)
    is_featured = db.Column(db.Boolean, default=False)

    # Relationships
    author = db.relationship('User', backref=db.backref('contents', lazy=True))
    articles = db.relationship('Article', back_populates='content', cascade='all, delete-orphan')
    comments = db.relationship('Comment', back_populates='content', cascade='all, delete-orphan')
    # Removed problematic favorites relationship - it's defined in Favorite models

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
            'is_featured': self.is_featured
        }