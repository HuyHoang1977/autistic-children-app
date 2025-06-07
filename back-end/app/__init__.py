import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from app.extensions import db
from flask_cors import CORS

# Import all models
from app.models.users_model import User
from app.models.roles_model import Role
from app.models.admins_model import Admin
from app.models.doctors_model import Doctor
from app.models.parents_model import Parent
from app.models.notifications_model import Notification
from app.models.favorites_model import Favorite
from app.models.contents_model import Content
from app.models.articles_model import Article
from app.models.categories_model import Category
from app.models.comments_model import Comment
from app.models.messages_model import Message
from app.models.appointments_model import Appointment
from app.models.childs_model import Child
from app.models.medical_records_model import MedicalRecord
from app.models.tags_model import Tag
from app.models.article_categories_model import ArticleCategory
from app.models.article_tags_model import ArticleTag
from app.models.doctor_specializations_model import DoctorSpecialization
from app.models.doctor_follows_model import DoctorFollow
from app.models.saved_articles_model import SavedArticle


def create_app():
    app = Flask(__name__)

    CORS(app)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://{username}:{password}@{host}:{port}/{database}'.format(
        username=os.environ['RDS_USERNAME'],
        password=os.environ['RDS_PASSWORD'],
        host=os.environ['RDS_HOSTNAME'],
        port=os.environ['RDS_PORT'],
        database=os.environ['RDS_DB_NAME'],
    )

    # connect the app to the database
    db.init_app(app)
    with app.app_context():
        db.create_all()

    from app.routers.user_router import bp as auth_bp
    app.register_blueprint(auth_bp)

    return app