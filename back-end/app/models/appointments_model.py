from app.extensions import db
from datetime import datetime


class Appointment(db.Model):
    __tablename__ = 'appointments'

    appointment_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('parents.parent_id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.doctor_id'), nullable=False)
    child_id = db.Column(db.Integer, db.ForeignKey('childs.child_id'), nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    appointment_type = db.Column(db.Integer, nullable=False)  # 1: consultation, 2: checkup, 3: emergency
    symptoms = db.Column(db.Text)
    notes = db.Column(db.Text)
    status = db.Column(db.Integer, default=1)  # 1: scheduled, 2: confirmed, 3: completed, 4: cancelled
    consultation_fee = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    parent = db.relationship('Parent', backref=db.backref('appointments', lazy=True))
    doctor = db.relationship('Doctor', backref=db.backref('appointments', lazy=True))
    child = db.relationship('Child', backref=db.backref('appointments', lazy=True))
    medical_records = db.relationship('MedicalRecord', back_populates='appointment', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'appointment_id': self.appointment_id,
            'parent_id': self.parent_id,
            'doctor_id': self.doctor_id,
            'child_id': self.child_id,
            'appointment_date': self.appointment_date.isoformat() if self.appointment_date else None,
            'appointment_type': self.appointment_type,
            'symptoms': self.symptoms,
            'notes': self.notes,
            'status': self.status,
            'consultation_fee': self.consultation_fee,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }