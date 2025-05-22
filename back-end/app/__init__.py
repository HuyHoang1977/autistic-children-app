from flask import Flask
import os
from app.models.models import db
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
    
    # Import models for Flask-Migrate detect
    from app.models import models
    
    from app.routers.user_routes import bp as auth_bp
    app.register_blueprint(auth_bp)
    
    return app