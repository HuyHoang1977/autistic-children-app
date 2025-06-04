from app.extensions import db


class ArticleCategory(db.Model):
    __tablename__ = 'article_categories'

    article_id = db.Column(db.Integer, db.ForeignKey('articles.article_id'), primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.category_id'), primary_key=True)

    # Relationships
    article = db.relationship('Article', back_populates='article_categories')
    category = db.relationship('Category', back_populates='article_categories')