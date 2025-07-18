from app.extensions import db
from datetime import datetime


class SavedArticle(db.Model):
    __tablename__ = 'saved_articles'

    saved_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('parents.parent_id'), nullable=False)
    article_id = db.Column(db.Integer, db.ForeignKey('articles.article_id'), nullable=False)
    saved_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    notes = db.Column(db.Text)

    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('parent_id', 'article_id', name='unique_parent_article_save'),
    )

    # ✅ SAFE RELATIONSHIPS - Use different backref names to avoid conflicts
    parent = db.relationship('Parent', backref=db.backref('parent_saved_articles', lazy=True))

    # ✅ CRITICAL FIX: Don't create backref on Article to avoid 'saved_by' conflicts
    # Access Article via property instead

    @property
    def article(self):
        """Get Article object safely"""
        try:
            from app.models.articles_model import Article
            return Article.query.get(self.article_id)
        except:
            return None

    def to_dict(self):
        return {
            'saved_id': self.saved_id,
            'parent_id': self.parent_id,
            'article_id': self.article_id,
            'saved_at': self.saved_at.isoformat() if self.saved_at else None,
            'notes': self.notes,
            'article': self.article.to_dict(include_content=False) if self.article else None,
            'parent': self.parent.to_dict() if self.parent else None
        }

    def __repr__(self):
        return f'<SavedArticle {self.saved_id}: Parent {self.parent_id} -> Article {self.article_id}>'