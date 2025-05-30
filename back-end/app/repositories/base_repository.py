from app.extensions import db

class BaseRepository:
    def __init__(self, model):
        self.model = model

    def get_by_id(self, id):
        return self.model.query.get(id)

    def get_by(self, **kwargs):
        return self.model.query.filter_by(**kwargs).first()

    def get_all(self):
        return self.model.query.all()

    def create(self, **kwargs):
        try:
            instance = self.model(**kwargs)
            db.session.add(instance)
            db.session.commit()
            return instance
        except Exception as e:
            db.session.rollback()
            raise e

    def update(self, instance, **kwargs):
        try:
            for key, value in kwargs.items():
                setattr(instance, key, value)
            db.session.commit()
            return instance
        except Exception as e:
            db.session.rollback()
            raise e

    def delete(self, instance):
        try:
            db.session.delete(instance)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise e