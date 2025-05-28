import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from app.extensions import db
from app.models.users_model import User
from app.models.roles_model import Role
from app.models.admins_model import Admin
from app.models.doctors_model import Doctor
from app.models.parents_model import Parent
from flask_cors import CORS 


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