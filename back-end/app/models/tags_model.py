from app.extensions import db
from datetime import datetime


class Tag(db.Model):
    __tablename__ = 'tags'

    tag_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.String(255))
    color = db.Column(db.String(10))  # Hex color code
    usage_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    article_tags = db.relationship('ArticleTag', back_populates='tag', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'tag_id': self.tag_id,
            'name': self.name,
            'description': self.description,
            'color': self.color,
            'usage_count': self.usage_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
