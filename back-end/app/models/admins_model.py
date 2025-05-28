from app.extensions import db

class Admin(db.Model):
    __tablename__ = 'admins'

    admin_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    admin_role = db.Column(db.String(50))
    permissions = db.Column(db.String(255))
    last_login = db.Column(db.Date)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.role_id'))
    
    user = db.relationship('User', back_populates='admin')
    role = db.relationship('Role', back_populates='admins')