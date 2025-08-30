import os
import logging
from datetime import timedelta, datetime
from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.extensions import db
from app.routers.doctors_router import doctors_bp
from app.routers.follow_router import follow_bp
from app.routers.personal_router import personal_bp
from app.routers.notification_router import notification_bp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_app():
    logger.info("🚀 Starting Flask application...")

    app = Flask(__name__)

    # ✅ CORS Configuration - COMPREHENSIVE SETUP
    CORS(app,
         origins=["http://localhost:3000", "http://127.0.0.1:3000"],
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         expose_headers=["Content-Range", "X-Content-Range"])

    # JWT Configuration
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
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
    jwt = JWTManager(app)

    # ✅ CRITICAL: Initialize MinIO auto-setup
    logger.info("📦 Initializing MinIO configuration...")
    try:
        from app.config.minio_config import minio_config
        logger.info("✅ MinIO auto-setup completed!")

        # Verify MinIO health
        health = minio_config.health_check()
        if health['status'] == 'healthy':
            logger.info("🎉 MinIO is ready and healthy!")
            logger.info(f"📍 MinIO Public Endpoint: {health.get('public_endpoint')}")
        else:
            logger.warning(f"⚠️  MinIO health check warning: {health.get('error', 'Unknown')}")

    except Exception as e:
        logger.error(f"❌ MinIO setup failed: {e}")
        logger.warning("⚠️  Continuing without MinIO - image uploads may fail")

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
            logger.info("✅ Database tables created successfully")
        except Exception as e:
            logger.error(f"❌ Error creating database tables: {e}")

    # ✅ Register ALL blueprints including ADMIN and PROFILE
    logger.info("📋 Registering API blueprints...")

    try:
        # Import all routers
        from app.routers.auth_router import bp as auth_bp
        from app.routers.articles_router import bp as articles_bp
        from app.routers.image_router import bp as image_bp

        # Try to import profile router (from develop)
        try:
            from app.routers.profile_router import bp as profile_bp
            profile_available = True
        except ImportError:
            profile_available = False
            logger.warning("⚠️ Profile router not found - skipping profile endpoints")

        # Try to import admin router (from feature/delete-user)
        try:
            from app.routers.admin_router import bp as admin_bp
            admin_available = True
        except ImportError:
            admin_available = False
            logger.warning("⚠️ Admin router not found - skipping admin endpoints")

        # Try to import comments router (may not exist in all versions)
        try:
            from app.routers.comments_router import bp as comments_bp
            comments_available = True
        except ImportError:
            comments_available = False
            logger.warning("⚠️ Comments router not found - skipping comments endpoints")

        # Auth routes
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        logger.info("✅ Auth blueprint registered: /api/auth")

        # Articles routes
        app.register_blueprint(articles_bp, url_prefix='/api/articles')
        logger.info("✅ Articles blueprint registered: /api/articles")

        # Images routes
        app.register_blueprint(image_bp, url_prefix='/api/images')
        logger.info("✅ Images blueprint registered: /api/images")
        
        app.register_blueprint(doctors_bp, url_prefix='/api/doctors')
        logger.info("✅ Doctors blueprint registered: /api/doctors")
        
        app.register_blueprint(follow_bp, url_prefix='/api/follow')
        logger.info("✅ Follow blueprint registered: /api/follow")
        
        app.register_blueprint(personal_bp, url_prefix='/api/personal')
        logger.info("✅ Personal blueprint registered: /api/personal")
        
        app.register_blueprint(notification_bp, url_prefix='/api/notifications')
        logger.info("✅ Notification blueprint registered: /api/notifications")

        # Profile routes (if available)
        if profile_available:
            app.register_blueprint(profile_bp, url_prefix='/api/profile')
            logger.info("✅ Profile blueprint registered: /api/profile")

        # Admin routes (if available)
        if admin_available:
            app.register_blueprint(admin_bp, url_prefix='/api/admin')
            logger.info("✅ Admin blueprint registered: /api/admin")

        # Comments routes (if available)
        if comments_available:
            app.register_blueprint(comments_bp, url_prefix='/api/v1/comments')
            logger.info("✅ Comments blueprint registered: /api/v1/comments")

        logger.info("🎉 All available API blueprints registered successfully!")

    except ImportError as e:
        logger.error(f"❌ Import error registering blueprints: {e}")
        logger.error("⚠️ Make sure these router files exist:")
        logger.error("   - app/routers/auth_router.py")
        logger.error("   - app/routers/articles_router.py")
        logger.error("   - app/routers/image_router.py")
        logger.error("   - app/routers/profile_router.py (optional)")
        logger.error("   - app/routers/admin_router.py (optional)")
        logger.error("   - app/routers/comments_router.py (optional)")
    except Exception as e:
        logger.error(f"❌ Error registering blueprints: {e}")

    # ✅ Enhanced health check endpoint with MinIO status
    @app.route('/')
    def health_check():
        services = {
            'auth': {'endpoint': '/api/auth', 'health': '/api/auth/health'},
            'articles': {'endpoint': '/api/articles', 'health': '/api/articles/health'},
            'comments': {'endpoint': '/api/v1/comments', 'health': '/api/v1/comments/health'},
            'images': {'endpoint': '/api/images', 'health': '/api/images/health'}
        }

        # Add profile service if available
        if 'profile_available' in locals() and profile_available:
            services['profile'] = {'endpoint': '/api/profile', 'health': '/api/profile/health'}

        # Add admin service if available
        if 'admin_available' in locals() and admin_available:
            services['admin'] = {'endpoint': '/api/admin', 'health': '/api/admin/health'}

        return {
            'message': 'Health Care API is running!',
            'status': 'healthy',
            'version': '1.0.0',
            'services': services,
            'debug_endpoints': {
                'routes': '/debug/routes',
                'test_images': '/test/images',
                'test_comments': '/test/comments',
                'test_upload': '/api/test-upload'
            }
        }

    # ✅ API health check with MinIO status
    @app.route('/api/health')
    def api_health_check():
        """Central health check for all API services including MinIO"""
        services_status = {}

        # Check database
        try:
            db.session.execute('SELECT 1')
            services_status['database'] = 'healthy'
        except Exception as e:
            services_status['database'] = f'unhealthy: {str(e)}'

        # ✅ Check MinIO status
        try:
            from app.config.minio_config import minio_config
            minio_health = minio_config.health_check()
            services_status['minio'] = {
                'status': minio_health['status'],
                'endpoint': minio_health.get('public_endpoint', 'unknown'),
                'buckets': minio_health.get('configured_buckets', {})
            }
        except Exception as e:
            services_status['minio'] = f'error: {str(e)}'

        # Determine overall health
        overall_healthy = (
                services_status['database'] == 'healthy' and
                (isinstance(services_status.get('minio'), dict) and
                 services_status['minio'].get('status') == 'healthy')
        )

        endpoints = {
            'auth': '/api/auth/health',
            'articles': '/api/articles/health',
            'comments': '/api/v1/comments/health',
            'images': '/api/images/health'
        }

        # Add admin endpoint if available
        try:
            from app.routers.admin_router import bp as admin_bp
            endpoints['admin'] = '/api/admin/health'
        except ImportError:
            pass

        return jsonify({
            'status': 'healthy' if overall_healthy else 'degraded',
            'services': services_status,
            'endpoints': endpoints,
            'timestamp': datetime.utcnow().isoformat(),
            'minio_info': services_status.get('minio', {})
        }), 200 if overall_healthy else 503

    # ✅ MinIO status endpoint
    @app.route('/api/minio/status')
    def minio_status():
        """Get detailed MinIO status"""
        try:
            from app.config.minio_config import minio_config
            health = minio_config.health_check()

            return jsonify({
                'success': True,
                'minio_status': health,
                'buckets_info': health.get('configured_buckets', {}),
                'public_endpoint': health.get('public_endpoint'),
                'connection': health.get('connection', 'unknown')
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e),
                'minio_status': 'unavailable'
            }), 500

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

        # Group routes by service
        grouped_routes = {
            'auth': [r for r in routes if r['rule'].startswith('/api/auth')],
            'articles': [r for r in routes if r['rule'].startswith('/api/articles')],
            'comments': [r for r in routes if r['rule'].startswith('/api/v1/comments')],
            'images': [r for r in routes if r['rule'].startswith('/api/images')],
            'profile': [r for r in routes if r['rule'].startswith('/api/profile')],
            'admin': [r for r in routes if r['rule'].startswith('/api/admin')],
            'system': [r for r in routes if not any(r['rule'].startswith(prefix) for prefix in
                                                    ['/api/auth', '/api/articles', '/api/v1/comments', '/api/images',
                                                     '/api/profile', '/api/admin'])]
        }

        return jsonify({
            'total_routes': len(routes),
            'services': {
                'auth': len(grouped_routes['auth']),
                'articles': len(grouped_routes['articles']),
                'comments': len(grouped_routes['comments']),
                'images': len(grouped_routes['images']),
                'profile': len(grouped_routes['profile']),
                'admin': len(grouped_routes['admin']),
                'system': len(grouped_routes['system'])
            },
            'routes_by_service': grouped_routes
        })

    # ✅ Test endpoint to verify images service
    @app.route('/test/images')
    def test_images():
        """Test endpoint to verify images service is working"""
        # Try to get MinIO status
        try:
            from app.config.minio_config import minio_config
            minio_health = minio_config.health_check()
            minio_info = {
                'status': minio_health['status'],
                'endpoint': minio_health.get('public_endpoint'),
                'buckets': list(minio_health.get('configured_buckets', {}).keys())
            }
        except Exception as e:
            minio_info = {'status': 'error', 'error': str(e)}

        return jsonify({
            'message': 'Images service test endpoint',
            'minio_status': minio_info,
            'available_endpoints': [
                'POST /api/images/upload',
                'DELETE /api/images/delete',
                'GET /api/images/list',
                'GET /api/images/health',
                'GET /api/images/proxy/<path>',
                'POST /api/images/avatar/upload/<user_id>',
                'POST /api/images/article/upload/<article_id>'
            ],
            'test_urls': [
                f"{minio_info.get('endpoint', 'http://localhost:9000')}/article-images/",
                '/api/images/health',
                '/api/minio/status'
            ]
        })

    # ✅ Test endpoint for comments
    @app.route('/test/comments')
    def test_comments():
        """Test endpoint to verify comments service is working"""
        return jsonify({
            'message': 'Comments service test endpoint',
            'available_endpoints': [
                'GET /api/v1/comments?content_id=<id>',
                'POST /api/v1/comments',
                'PUT /api/v1/comments/<id>',
                'DELETE /api/v1/comments/<id>',
                'POST /api/v1/comments/<id>/like',
                'GET /api/v1/comments/my-comments',
                'GET /api/v1/comments/health'
            ],
            'note': 'Use these endpoints for comment operations'
        })

    # ✅ Test admin endpoint
    @app.route('/test/admin')
    def test_admin():
        """Test endpoint to verify admin service is working"""
        return jsonify({
            'message': 'Admin service test endpoint',
            'available_endpoints': [
                'GET /api/admin/users (requires admin token)',
                'GET /api/admin/users/<id> (requires admin token)',
                'PUT /api/admin/users/<id>/status (requires admin token)',
                'DELETE /api/admin/users/<id> (requires admin token)',
                'GET /api/admin/stats (requires admin token)',
                'GET /api/admin/health'
            ],
            'note': 'Admin endpoints require valid JWT token with admin role (role_id = 1)'
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
        available_endpoints = {
            "auth": "/api/auth/login, /api/auth/register, /api/auth/refresh",
            "articles": "/api/articles (GET, POST), /api/articles/{id} (GET, PUT, DELETE)",
            "comments": "/api/v1/comments (GET, POST), /api/v1/comments/{id} (PUT, DELETE)",
            "images": "/api/images/upload, /api/images/delete, /api/images/list",
            "debug": "/debug/routes, /test/images, /test/comments (development only)"
        }

        # Add admin endpoints if available
        try:
            from app.routers.admin_router import bp as admin_bp
            available_endpoints["admin"] = "/api/admin/users, /api/admin/users/{id}, /api/admin/stats"
        except ImportError:
            pass

        return jsonify({
            "success": False,
            "error": "Endpoint not found",
            "error_code": "NOT_FOUND",
            "requested_url": request.url,
            "available_endpoints": available_endpoints
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

    # ✅ Enhanced request logging middleware for debugging
    @app.before_request
    def log_request_info():
        # Log image requests
        if '/api/images' in request.path:
            logger.info(f"🔍 IMAGE REQUEST: {request.method} {request.path}")
            logger.debug(f"📋 Headers: {dict(request.headers)}")
            logger.debug(f"📁 Form data: {dict(request.form)}")
            logger.debug(f"📎 Files: {list(request.files.keys())}")

        # Log comment requests
        if '/api/v1/comments' in request.path:
            logger.info(f"💬 COMMENT REQUEST: {request.method} {request.path}")
            if request.method in ['POST', 'PUT']:
                logger.debug(f"📄 JSON data: {request.get_json()}")

        # Log admin requests
        if '/api/admin' in request.path:
            logger.info(f"👑 ADMIN REQUEST: {request.method} {request.path}")
            if request.method in ['POST', 'PUT']:
                logger.debug(f"📄 JSON data: {request.get_json()}")

        # Log MinIO status requests
        if '/api/minio' in request.path:
            logger.info(f"📦 MINIO REQUEST: {request.method} {request.path}")

    logger.info("✅ Flask application initialized successfully!")
    logger.info("🌐 API Server ready to serve requests")
    logger.info("👑 Admin API endpoints are available at /api/admin/*")
    logger.info("👤 Profile API endpoints are available at /api/profile/*")

    return app