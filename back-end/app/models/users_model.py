from app.extensions import db, bcrypt
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime


class User(db.Model):
    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(255), nullable=False, unique=True)
    email = db.Column(db.String(255), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(255))
    avatar_url = db.Column(db.String(255))
    created_at = db.Column(db.Date, default=datetime.utcnow().date())
    updated_at = db.Column(db.Date, default=datetime.utcnow().date())
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    user_type = db.Column(db.Integer)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.role_id'))

    # ✅ SAFE RELATIONSHIPS
    admin = db.relationship('Admin', back_populates='user', uselist=False)
    doctor = db.relationship('Doctor', back_populates='user', uselist=False)
    parent = db.relationship('Parent', back_populates='user', uselist=False)
    role = db.relationship('Role', back_populates='users', lazy=True)

    # ✅ FIXED: Use bcrypt from extensions instead of werkzeug
    @hybrid_property
    def password(self):
        raise AttributeError("Password is write-only.")

    @password.setter
    def password(self, password):
        """Use bcrypt from extensions for consistency"""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        """Use bcrypt from extensions for consistency"""
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'phone': self.phone,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_active': self.is_active,
            'user_type': self.user_type,
            'role_id': self.role_id
        }

    def __repr__(self):
        return f'<User {self.username}>'