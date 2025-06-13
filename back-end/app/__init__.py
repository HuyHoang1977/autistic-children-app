import os
from flask import Flask
from flask_jwt_extended import JWTManager
from app.extensions import db
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    jwt = JWTManager(app)
    CORS(app)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://{username}:{password}@{host}:{port}/{database}'.format(
        username=os.environ.get('RDS_USERNAME', 'user'),
        password=os.environ.get('RDS_PASSWORD', 'password'),
        host=os.environ.get('RDS_HOSTNAME', 'psql-db'),
        port=os.environ.get('RDS_PORT', '5432'),
        database=os.environ.get('RDS_DB_NAME', 'autistic_children_db'),
    )
    
    # Configure file upload
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
    app.config['UPLOAD_FOLDER'] = '/tmp/uploads'
    
    
    
    db.init_app(app)
    with app.app_context():
        db.create_all()

    from app.routers.auth_router import bp as auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # Register blueprints
    from app.routers.image_router import bp as image_bp
    app.register_blueprint(image_bp, url_prefix='/api/images')
    
    @app.route('/')
    def health_check():
        return {'message': 'Flask app is running!', 'status': 'healthy'}
    
    return app
