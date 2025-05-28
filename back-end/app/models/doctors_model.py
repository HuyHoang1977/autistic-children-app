from app.extensions import db

class Doctor(db.Model):
    __tablename__ = 'doctors'

    doctor_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    license_number = db.Column(db.String(100))
    specialty = db.Column(db.String(100))
    years_experience = db.Column(db.Integer)
    bio = db.Column(db.String(100))
    clinic_name = db.Column(db.String(100))
    clinic_address = db.Column(db.String(100))
    verified = db.Column(db.Boolean, default=False)
    verification_date = db.Column(db.Date)
    rating = db.Column(db.Float)
    total_reviews = db.Column(db.Integer)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.role_id'))
    
    user = db.relationship('User', back_populates='doctor')
    role = db.relationship('Role', back_populates='doctors')