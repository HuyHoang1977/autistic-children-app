from app.extensions import db
from datetime import datetime


class Message(db.Model):
    __tablename__ = 'messages'

    message_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    subject = db.Column(db.String(255))
    content = db.Column(db.Text, nullable=False)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    read_at = db.Column(db.DateTime)
    is_deleted = db.Column(db.Boolean, default=False)
    message_type = db.Column(db.Integer, default=1)  # 1: normal, 2: system, 3: appointment

    # Relationships
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_messages')

    def to_dict(self):
        return {
            'message_id': self.message_id,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'subject': self.subject,
            'content': self.content,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'is_deleted': self.is_deleted,
            'message_type': self.message_type
        }