from app.extensions import db
from datetime import datetime


class Comment(db.Model):
    __tablename__ = 'comments'

    comment_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    content_id = db.Column(db.Integer, db.ForeignKey('contents.content_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    parent_comment_id = db.Column(db.Integer, db.ForeignKey('comments.comment_id'))
    comment_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    like_count = db.Column(db.Integer, default=0)
    is_approved = db.Column(db.Boolean, default=True)

    # Relationships
    content = db.relationship('Content', back_populates='comments')
    user = db.relationship('User', backref=db.backref('comments', lazy=True))
    parent = db.relationship('Comment', remote_side=[comment_id], backref='replies')

    def to_dict(self):
        return {
            'comment_id': self.comment_id,
            'content_id': self.content_id,
            'user_id': self.user_id,
            'parent_comment_id': self.parent_comment_id,
            'comment_text': self.comment_text,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'like_count': self.like_count,
            'is_approved': self.is_approved
        }