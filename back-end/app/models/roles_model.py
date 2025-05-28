from app.extensions import db

class Role(db.Model):
    __tablename__ = 'roles'

    role_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    role_name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.Date)
    updated_at = db.Column(db.Date)
    
    users = db.relationship('User', back_populates='role', lazy=True)
    admins = db.relationship('Admin', back_populates='role', lazy=True)
    doctors = db.relationship('Doctor', back_populates='role', lazy=True)
    parents = db.relationship('Parent', back_populates='role', lazy=True)