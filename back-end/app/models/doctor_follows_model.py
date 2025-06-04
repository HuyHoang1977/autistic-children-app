from app.extensions import db
from datetime import datetime


class DoctorFollow(db.Model):
    __tablename__ = 'doctor_follows'

    follow_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('parents.parent_id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.doctor_id'), nullable=False)
    followed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('parent_id', 'doctor_id', name='unique_parent_doctor_follow'),
    )

    # Relationships
    parent = db.relationship('Parent', backref=db.backref('doctor_follows', lazy=True))
    doctor = db.relationship('Doctor', backref=db.backref('followers', lazy=True))

    def to_dict(self):
        return {
            'follow_id': self.follow_id,
            'parent_id': self.parent_id,
            'doctor_id': self.doctor_id,
            'followed_at': self.followed_at.isoformat() if self.followed_at else None,
            'is_active': self.is_active
        }