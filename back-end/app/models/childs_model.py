from app.extensions import db
from datetime import datetime


class Child(db.Model):
    __tablename__ = 'childs'

    child_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('parents.parent_id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(10), nullable=False)  # 'male', 'female'
    weight = db.Column(db.Float)
    height = db.Column(db.Float)
    medical_history = db.Column(db.Text)
    allergies = db.Column(db.Text)
    vaccination_record = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    parent = db.relationship('Parent', backref=db.backref('children', lazy=True))
    medical_records = db.relationship('MedicalRecord', back_populates='child', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'child_id': self.child_id,
            'parent_id': self.parent_id,
            'name': self.name,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'gender': self.gender,
            'weight': self.weight,
            'height': self.height,
            'medical_history': self.medical_history,
            'allergies': self.allergies,
            'vaccination_record': self.vaccination_record,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }