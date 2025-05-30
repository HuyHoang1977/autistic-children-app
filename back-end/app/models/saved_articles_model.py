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

    # Relationships
    parent = db.relationship('Parent', backref=db.backref('saved_articles', lazy=True))
    article = db.relationship('Article', backref=db.backref('saved_by', lazy=True))

    def to_dict(self):
        return {
            'saved_id': self.saved_id,
            'parent_id': self.parent_id,
            'article_id': self.article_id,
            'saved_at': self.saved_at.isoformat() if self.saved_at else None,
            'notes': self.notes
        }