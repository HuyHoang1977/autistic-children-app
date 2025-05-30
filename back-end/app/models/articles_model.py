from app.extensions import db
from datetime import datetime


class Article(db.Model):
    __tablename__ = 'articles'

    article_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    content_id = db.Column(db.Integer, db.ForeignKey('contents.content_id'), nullable=False)
    content_body = db.Column(db.Text, nullable=False)
    excerpt = db.Column(db.String(255))
    featured_image = db.Column(db.String(255))
    media_attachments = db.Column(db.Text)  # JSON string for multiple attachments
    like_count = db.Column(db.Integer, default=0)
    comment_count = db.Column(db.Integer, default=0)
    share_count = db.Column(db.Integer, default=0)
    allow_comments = db.Column(db.Boolean, default=True)
    article_status = db.Column(db.Integer, default=1)  # 1: draft, 2: published, 3: archived

    # Relationships
    content = db.relationship('Content', back_populates='articles')
    article_categories = db.relationship('ArticleCategory', back_populates='article', cascade='all, delete-orphan')
    article_tags = db.relationship('ArticleTag', back_populates='article', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'article_id': self.article_id,
            'content_id': self.content_id,
            'content_body': self.content_body,
            'excerpt': self.excerpt,
            'featured_image': self.featured_image,
            'media_attachments': self.media_attachments,
            'like_count': self.like_count,
            'comment_count': self.comment_count,
            'share_count': self.share_count,
            'allow_comments': self.allow_comments,
            'article_status': self.article_status
        }