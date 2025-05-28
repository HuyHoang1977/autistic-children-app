from werkzeug.security import check_password_hash
from app.extensions import db

class User(db.Model):
    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(255))
    avatar_url = db.Column(db.String(255))
    created_at = db.Column(db.Date)
    updated_at = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    user_type = db.Column(db.Integer)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.role_id'))
    
    admin = db.relationship('Admin', back_populates='user', uselist=False)
    doctor = db.relationship('Doctor', back_populates='user', uselist=False)
    parent = db.relationship('Parent', back_populates='user', uselist=False)
    role = db.relationship('Role', back_populates='users', lazy=True)
    

    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
