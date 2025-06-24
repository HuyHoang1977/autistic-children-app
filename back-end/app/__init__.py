# SỬA FILE: app/__init__.py
# XÓA phần @app.after_request để tránh duplicate headers

import os
from datetime import timedelta
from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.extensions import db
from app.routers.auth_router import bp as auth_bp
from app.routers.image_router import bp as image_bp
# ✅ Import the new articles router
from app.routers.articles_router import bp as articles_bp


def create_app():
    app = Flask(__name__)

    # ✅ CORS Configuration - CRITICAL FIX
    CORS(app,
         origins=["http://localhost:3000", "http://127.0.0.1:3000"],
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         expose_headers=["Content-Range", "X-Content-Range"])

    # ❌ XÓA TOÀN BỘ PHẦN NÀY ĐỂ TRÁNH DUPLICATE HEADERS:
    # @app.after_request
    # def after_request(response):
    #     response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    #     response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    #     response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    #     response.headers.add('Access-Control-Allow-Credentials', 'true')
    #     return response

    # JWT Configuration
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)  # Token expires in 24 hours
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)  # Refresh token expires in 30 days
    app.config["JWT_ALGORITHM"] = "HS256"

    # PostgreSQL Database Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://{username}:{password}@{host}:{port}/{database}'.format(
        username=os.environ.get('RDS_USERNAME', 'user'),
        password=os.environ.get('RDS_PASSWORD', 'password'),
        host=os.environ.get('RDS_HOSTNAME', 'psql-db'),
        port=os.environ.get('RDS_PORT', '5432'),
        database=os.environ.get('RDS_DB_NAME', 'autistic_children_db'),
    )

    # SQLAlchemy Configuration
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }

    # File Upload Configuration
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
    app.config['UPLOAD_FOLDER'] = '/tmp/uploads'

    # Initialize extensions
    db.init_app(app)

    # Initialize JWT Manager
    jwt = JWTManager(app)

    # JWT Error Handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "success": False,
            "error": "Token has expired",
            "error_code": "TOKEN_EXPIRED"
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            "success": False,
            "error": "Invalid token format",
            "error_code": "INVALID_TOKEN"
        }), 422

    @jwt.unauthorized_loader
    def unauthorized_callback(error):
        return jsonify({
            "success": False,
            "error": "Authorization token is required",
            "error_code": "AUTHORIZATION_REQUIRED"
        }), 401

    @jwt.needs_fresh_token_loader
    def token_not_fresh_callback(jwt_header, jwt_payload):
        return jsonify({
            "success": False,
            "error": "Fresh token required",
            "error_code": "FRESH_TOKEN_REQUIRED"
        }), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "success": False,
            "error": "Token has been revoked",
            "error_code": "TOKEN_REVOKED"
        }), 401

    # Create database tables
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables created successfully")
        except Exception as e:
            print(f"❌ Error creating database tables: {e}")

    # ✅ Register blueprints
    try:
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        print("✅ Auth blueprint registered: /api/auth")

        app.register_blueprint(image_bp, url_prefix='/api/images')
        print("✅ Images blueprint registered: /api/images")

        app.register_blueprint(articles_bp, url_prefix='/api/articles')
        print("✅ Articles blueprint registered: /api/articles")

    except Exception as e:
        print(f"❌ Error registering blueprints: {e}")

    # Health check endpoint
    @app.route('/')
    def health_check():
        return {
            'message': 'Flask app is running!',
            'status': 'healthy',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth/*',
                'articles': '/api/articles/*',
                'images': '/api/images/*',
                'health': '/',
                'debug': '/debug/routes'
            }
        }

    # ✅ Route testing endpoint for development
    @app.route('/debug/routes')
    def list_routes():
        """List all available routes - for development only"""
        routes = []
        for rule in app.url_map.iter_rules():
            methods = ','.join(rule.methods - {'HEAD', 'OPTIONS'})
            routes.append({
                'endpoint': rule.endpoint,
                'methods': methods,
                'rule': rule.rule
            })
        return jsonify({
            'total_routes': len(routes),
            'routes': sorted(routes, key=lambda x: x['rule'])
        })

    # ✅ Test endpoint to verify images service
    @app.route('/test/images')
    def test_images():
        """Test endpoint to verify images service is working"""
        return jsonify({
            'message': 'Images service test endpoint',
            'available_endpoints': [
                'POST /api/images/upload',
                'DELETE /api/images/delete',
                'GET /api/images/list',
                'GET /api/images/health',
                'POST /api/images/avatar/upload/<user_id>',
                'POST /api/images/article/upload/<article_id>'
            ],
            'note': 'Use these endpoints for image operations'
        })

    # ✅ Test upload endpoint (fallback)
    @app.route('/api/test-upload', methods=['POST', 'OPTIONS'])
    def test_upload():
        """Test upload endpoint to verify multipart/form-data handling"""
        if request.method == 'OPTIONS':
            response = jsonify({})
            return response

        try:
            # Check if file is in request
            if 'file' not in request.files:
                return jsonify({
                    'success': False,
                    'error': 'No file in request',
                    'received_form_data': list(request.form.keys()),
                    'received_files': list(request.files.keys())
                }), 400

            file = request.files['file']
            return jsonify({
                'success': True,
                'message': 'Test upload successful',
                'file_info': {
                    'filename': file.filename,
                    'content_type': file.content_type,
                    'size': len(file.read()) if file else 0
                },
                'form_data': dict(request.form),
                'note': 'This is a test endpoint. Real upload uses /api/images/upload'
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Test upload error: {str(e)}'
            }), 500

    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "error": "Endpoint not found",
            "error_code": "NOT_FOUND",
            "requested_url": request.url,
            "available_endpoints": {
                "auth": "/api/auth/login, /api/auth/register, /api/auth/refresh",
                "articles": "/api/articles (GET, POST), /api/articles/{id} (GET, PUT, DELETE)",
                "images": "/api/images/upload, /api/images/delete, /api/images/list",
                "debug": "/debug/routes, /test/images (development only)"
            }
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "success": False,
            "error": "Method not allowed",
            "error_code": "METHOD_NOT_ALLOWED",
            "allowed_methods": list(error.description) if hasattr(error, 'description') else []
        }), 405

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({
            "success": False,
            "error": "File too large. Maximum size is 16MB",
            "error_code": "FILE_TOO_LARGE"
        }), 413

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "error_code": "INTERNAL_ERROR"
        }), 500

    # ✅ Request logging middleware for debugging
    @app.before_request
    def log_request_info():
        if '/api/images' in request.path:
            print(f"🔍 {request.method} {request.path}")
            print(f"📋 Headers: {dict(request.headers)}")
            print(f"📁 Form data: {dict(request.form)}")
            print(f"📎 Files: {list(request.files.keys())}")

    return app