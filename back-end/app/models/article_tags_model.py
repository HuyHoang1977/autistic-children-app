from app.extensions import db


class ArticleTag(db.Model):
    __tablename__ = 'article_tags'

    article_id = db.Column(db.Integer, db.ForeignKey('articles.article_id'), primary_key=True)
    tag_id = db.Column(db.Integer, db.ForeignKey('tags.tag_id'), primary_key=True)

    # Relationships
    article = db.relationship('Article', back_populates='article_tags')
    tag = db.relationship('Tag', back_populates='article_tags')
