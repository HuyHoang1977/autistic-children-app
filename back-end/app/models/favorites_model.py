from app.extensions import db
from datetime import datetime


class Favorite(db.Model):
    __tablename__ = 'favorites'

    like_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    content_id = db.Column(db.Integer, db.ForeignKey('contents.content_id'), nullable=False)  # Added ForeignKey
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    like_type = db.Column(db.Integer, nullable=False)  # 1: article, 2: video, 3: doctor, 4: tip, etc.

    # Relationships
    user = db.relationship('User', backref=db.backref('favorites', lazy=True))
    content = db.relationship('Content', backref=db.backref('favorites', lazy=True))

    # Unique constraint để tránh duplicate likes
    __table_args__ = (
        db.UniqueConstraint('user_id', 'content_id', 'like_type', name='unique_user_content_like'),
    )

    def to_dict(self):
        return {
            'like_id': self.like_id,
            'content_id': self.content_id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'like_type': self.like_type
        }