from app.extensions import db

class Parent(db.Model):
    __tablename__ = 'parents'

    parent_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    number_of_children = db.Column(db.Integer)
    children_info = db.Column(db.String(255))
    parenting_concerns = db.Column(db.String(255))
    last_activity = db.Column(db.Date)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.role_id'))
    
    user = db.relationship('User', back_populates='parent')
    role = db.relationship('Role', back_populates='parents')