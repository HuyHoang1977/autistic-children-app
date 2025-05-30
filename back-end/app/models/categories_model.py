from app.extensions import db


class Category(db.Model):
    __tablename__ = 'categories'

    category_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    icon_url = db.Column(db.String(255))
    parent_category_id = db.Column(db.Integer, db.ForeignKey('categories.category_id'))
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)

    # Self-referential relationship for parent/child categories
    parent = db.relationship('Category', remote_side=[category_id], backref='children')
    article_categories = db.relationship('ArticleCategory', back_populates='category', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'category_id': self.category_id,
            'name': self.name,
            'description': self.description,
            'icon_url': self.icon_url,
            'parent_category_id': self.parent_category_id,
            'sort_order': self.sort_order,
            'is_active': self.is_active
        }