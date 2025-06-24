from app.extensions import db

class Doctor(db.Model):
    __tablename__ = 'doctors'

    doctor_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    license_number = db.Column(db.String(100), nullable=True)
    specialty = db.Column(db.String(100), nullable=True)
    years_experience = db.Column(db.Integer, nullable=True)
    bio = db.Column(db.String(100), nullable=True)
    clinic_name = db.Column(db.String(100), nullable=True)
    clinic_address = db.Column(db.String(100), nullable=True)
    verified = db.Column(db.Boolean, default=False)
    verification_date = db.Column(db.Date, nullable=True)
    rating = db.Column(db.Float, nullable=True)
    total_reviews = db.Column(db.Integer, nullable=True)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.role_id'), nullable=True)
    
    user = db.relationship('User', back_populates='doctor')
    role = db.relationship('Role', back_populates='doctors')
    
    def to_dict(self):
        return {
            'doctor_id': self.doctor_id,
            'user_id': self.user_id,
            'license_number': self.license_number,
            'specialty': self.specialty,
            'years_experience': self.years_experience,
            'bio': self.bio,
            'clinic_name': self.clinic_name,
            'clinic_address': self.clinic_address,
            'verified': self.verified,
            'verification_date': self.verification_date.isoformat() if self.verification_date else None,
            'rating': self.rating,
            'total_reviews': self.total_reviews,
            'role_id': self.role_id
        }