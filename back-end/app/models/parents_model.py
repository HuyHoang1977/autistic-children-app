from app.extensions import db

class Parent(db.Model):
    __tablename__ = 'parents'

    parent_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    number_of_children = db.Column(db.Integer, nullable=True)
    children_info = db.Column(db.String(255), nullable=True)
    parenting_concerns = db.Column(db.String(255), nullable=True)
    last_activity = db.Column(db.Date, nullable=True)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.role_id'), nullable=True)
    
    user = db.relationship('User', back_populates='parent')
    role = db.relationship('Role', back_populates='parents')
    
    def to_dict(self):
        return {
            'parent_id': self.parent_id,
            'user_id': self.user_id,
            'number_of_children': self.number_of_children,
            'children_info': self.children_info,
            'parenting_concerns': self.parenting_concerns,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'role_id': self.role_id
        }