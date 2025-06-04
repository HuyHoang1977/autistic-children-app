from app.extensions import db


class DoctorSpecialization(db.Model):
    __tablename__ = 'doctor_specializations'

    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.doctor_id'), primary_key=True)
    specialization = db.Column(db.String(100), primary_key=True)
    is_primary = db.Column(db.Boolean, default=False)

    # Relationships
    doctor = db.relationship('Doctor', backref=db.backref('specializations', lazy=True))
