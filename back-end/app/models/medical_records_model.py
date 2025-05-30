from app.extensions import db
from datetime import datetime


class MedicalRecord(db.Model):
    __tablename__ = 'medical_records'

    record_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.appointment_id'), nullable=False)
    child_id = db.Column(db.Integer, db.ForeignKey('childs.child_id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.doctor_id'), nullable=False)
    diagnosis = db.Column(db.Text, nullable=False)
    treatment = db.Column(db.Text)
    medication = db.Column(db.Text)
    follow_up_notes = db.Column(db.Text)
    attachments = db.Column(db.Text)  # JSON for file attachments
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    appointment = db.relationship('Appointment', back_populates='medical_records')
    child = db.relationship('Child', back_populates='medical_records')
    doctor = db.relationship('Doctor', backref=db.backref('medical_records', lazy=True))

    def to_dict(self):
        return {
            'record_id': self.record_id,
            'appointment_id': self.appointment_id,
            'child_id': self.child_id,
            'doctor_id': self.doctor_id,
            'diagnosis': self.diagnosis,
            'treatment': self.treatment,
            'medication': self.medication,
            'follow_up_notes': self.follow_up_notes,
            'attachments': self.attachments,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }