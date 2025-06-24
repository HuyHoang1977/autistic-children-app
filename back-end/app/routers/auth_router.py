import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    verify_jwt_in_request,
    get_jwt
)
from app.services.auth_service import AuthService
from app.validations.auth_validation import validate_login_data, validate_register_data
from app.models.doctor_specializations_model import DoctorSpecialization
from app.extensions import db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('auth.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

bp = Blueprint('auth', __name__)
auth_service = AuthService()


def get_user_id_from_jwt():
    """
    Helper function to get user_id from JWT and convert to integer
    Returns integer user_id or None if invalid
    """
    try:
        current_user_identity = get_jwt_identity()
        if current_user_identity is None:
            return None

        # Convert string back to integer for database queries
        if isinstance(current_user_identity, str):
            return int(current_user_identity)
        elif isinstance(current_user_identity, int):
            return current_user_identity
        else:
            logger.error('Invalid JWT identity type: %s', type(current_user_identity))
            return None

    except (ValueError, TypeError) as e:
        logger.error('Error converting JWT identity to user_id: %s', str(e))
        return None
    except Exception as e:
        logger.error('Unexpected error getting user_id from JWT: %s', str(e))
        return None


@bp.route('/users', methods=['GET'])
def get_users():
    """Get all users"""
    logger.info('Fetching all users')
    try:
        users = auth_service.get_all_users()
        serialized_users = [auth_service.get_user_with_role(user) for user in users]
        logger.info('Successfully fetched %d users', len(serialized_users))
        return jsonify({"data": serialized_users}), 200
    except Exception as e:
        logger.error('Error fetching users: %s', str(e), exc_info=True)
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500


@bp.route('/specializations', methods=['GET'])
def get_specializations():
    """Get all doctor specializations"""
    logger.info('Fetching specializations')
    try:
        specializations = (
            db.session.query(DoctorSpecialization.specialization)
            .distinct()
            .order_by(DoctorSpecialization.specialization)
            .all()
        )
        result = [s[0] for s in specializations]
        logger.info('Successfully fetched %d specializations', len(result))
        return jsonify(result), 200
    except Exception as e:
        logger.error('Error fetching specializations: %s', str(e), exc_info=True)
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500


@bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    logger.info('Login attempt')
    data = request.get_json()

    if not data:
        logger.warning('Invalid or missing JSON payload for login')
        return jsonify({"error": "Invalid or missing JSON payload"}), 400

    logger.debug('Login data: %s', {'email': data.get('email'), 'password': '****'})
    errors = validate_login_data(data)
    if errors:
        logger.warning('Login validation errors: %s', errors)
        return jsonify({"success": False, "errors": errors}), 400

    try:
        user, error = auth_service.login_user(data.get('email'), data.get('password'))
        if error or not user:
            logger.warning('Login failed for email %s: %s', data.get('email'), error)
            return jsonify({"success": False, "errors": error.get("errors", ["Login failed"])}), 401

        # 🔧 FIX: Convert user_id to string for JWT
        access_token = create_access_token(identity=str(user.user_id))
        refresh_token = create_refresh_token(identity=str(user.user_id))
        user_data = auth_service.get_user_with_role(user)

        logger.info('Successful login for user_id: %s', user.user_id)
        logger.info('Generated access token for user_id: %s (as string)', str(user.user_id))

        return jsonify({
            "success": True,
            "data": {
                "user": user_data,
                "token": access_token,
                "refresh_token": refresh_token
            }
        }), 200
    except Exception as e:
        logger.error('Login error: %s, Data: %s', str(e), data, exc_info=True)
        return jsonify({"success": False, "errors": [f"Internal server error: {str(e)}"]}), 500


@bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    logger.info('Registration attempt')
    data = request.get_json()

    if not data:
        logger.warning('Invalid or missing JSON payload for registration')
        return jsonify({"error": "Invalid or missing JSON payload"}), 400

    logger.debug('Register data: %s', data)
    errors = validate_register_data(data)
    if errors:
        logger.warning('Registration validation errors: %s', errors)
        return jsonify({"success": False, "errors": errors}), 400

    try:
        data['user_type'] = data.get('user_type', data['role_id'])
        user, error = auth_service.register_user(data)
        if error or not user:
            logger.warning('Registration failed: %s', error)
            return jsonify({"success": False, "errors": error.get("errors", ["Registration failed"])}), 400

        # 🔧 FIX: Convert user_id to string for JWT
        access_token = create_access_token(identity=str(user.user_id))
        refresh_token = create_refresh_token(identity=str(user.user_id))
        user_data = auth_service.get_user_with_role(user)

        logger.info('Successful registration for user_id: %s (as string)', str(user.user_id))
        return jsonify({
            "success": True,
            "data": {
                "user": user_data,
                "token": access_token,
                "refresh_token": refresh_token
            }
        }), 201
    except Exception as e:
        logger.error('Registration error: %s, Data: %s', str(e), data, exc_info=True)
        return jsonify({"success": False, "errors": [f"Internal server error: {str(e)}"]}), 500


@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Token refresh endpoint"""
    current_user_id_str = get_jwt_identity()  # This is now string
    logger.info('Token refresh attempt for user_id: %s', current_user_id_str)

    try:
        # Convert string back to int for service call if needed
        current_user_id = int(current_user_id_str) if current_user_id_str else None

        token, error = auth_service.refresh_token(current_user_id)
        if error or not token:
            logger.warning('Token refresh failed for user_id %s: %s', current_user_id_str, error)
            return jsonify({"success": False, "errors": error.get("errors", ["Token refresh failed"])}), 401

        logger.info('Successful token refresh for user_id: %s', current_user_id_str)
        return jsonify({"success": True, "data": {"token": token}}), 200
    except Exception as e:
        logger.error('Token refresh error: %s', str(e), exc_info=True)
        return jsonify({"success": False, "errors": [f"Internal server error: {str(e)}"]}), 500


@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """User logout endpoint"""
    current_user_id_str = get_jwt_identity()
    logger.info('Logout attempt for user_id: %s', current_user_id_str)

    try:
        # For now, just return success since we're using stateless JWT
        # In production, you might want to implement token blacklisting
        logger.info('Successful logout for user_id: %s', current_user_id_str)
        return jsonify({
            "success": True,
            "message": "Successfully logged out"
        }), 200
    except Exception as e:
        logger.error('Logout error: %s', str(e), exc_info=True)
        return jsonify({"success": False, "errors": [f"Internal server error: {str(e)}"]}), 500


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user info"""
    logger.info('Fetching current user info')

    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            logger.error('No valid user ID found in JWT')
            return jsonify({
                "success": False,
                "error": "Invalid user identity in JWT token",
                "error_code": "INVALID_USER_IDENTITY"
            }), 422

        # Get user from database
        user = auth_service.auth_repo.get_user_by(user_id=current_user_id)
        if not user:
            logger.warning('User not found for user_id: %s', current_user_id)
            return jsonify({
                "success": False,
                "error": "User not found",
                "error_code": "USER_NOT_FOUND"
            }), 404

        if not user.is_active:
            logger.warning('User account is deactivated for user_id: %s', current_user_id)
            return jsonify({
                "success": False,
                "error": "Account is deactivated",
                "error_code": "ACCOUNT_DEACTIVATED"
            }), 403

        user_data = auth_service.get_user_with_role(user)
        logger.info('Successfully fetched current user info for user_id: %s', current_user_id)

        return jsonify({
            "success": True,
            "data": user_data
        }), 200

    except Exception as e:
        logger.error('Error fetching current user: %s', str(e), exc_info=True)
        return jsonify({
            "success": False,
            "error": f"Failed to fetch user info: {str(e)}",
            "error_code": "INTERNAL_ERROR"
        }), 500


# CORS preflight handlers
@bp.route('/login', methods=['OPTIONS'])
@bp.route('/register', methods=['OPTIONS'])
@bp.route('/refresh', methods=['OPTIONS'])
@bp.route('/logout', methods=['OPTIONS'])
@bp.route('/me', methods=['OPTIONS'])
@bp.route('/users', methods=['OPTIONS'])
@bp.route('/specializations', methods=['OPTIONS'])
def auth_options():
    """Handle CORS preflight requests for auth endpoints"""
    logger.info('Handling OPTIONS request for auth endpoints')
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response, 200


# Debug endpoints (for development only)
@bp.route('/debug-jwt', methods=['GET'])
def debug_jwt():
    """Debug JWT token for troubleshooting"""
    logger.info('=== JWT DEBUG START ===')

    try:
        # Get Authorization header
        auth_header = request.headers.get('Authorization')

        debug_info = {
            "auth_header_present": bool(auth_header),
            "auth_header_preview": auth_header[:50] if auth_header else None,
            "request_headers": dict(request.headers),
            "request_method": request.method,
            "request_url": request.url
        }

        logger.info('🔍 Debug Info: %s', debug_info)

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            debug_info.update({
                "token_present": bool(token),
                "token_length": len(token) if token else 0,
                "token_preview": token[:20] if token else None,
                "token_parts": len(token.split('.')) if token else 0
            })

            # Try JWT verification
            try:
                verify_jwt_in_request()
                current_user_id_str = get_jwt_identity()  # String
                current_user_id = get_user_id_from_jwt()  # Integer
                current_jwt = get_jwt()

                debug_info.update({
                    "jwt_valid": True,
                    "user_id_string": current_user_id_str,
                    "user_id_integer": current_user_id,
                    "jwt_claims": current_jwt
                })

                logger.info('✅ JWT validation successful for user_id: %s (string: %s)', current_user_id,
                            current_user_id_str)

            except Exception as jwt_error:
                debug_info.update({
                    "jwt_valid": False,
                    "jwt_error": str(jwt_error),
                    "jwt_error_type": type(jwt_error).__name__
                })

                logger.error('❌ JWT validation failed: %s', str(jwt_error))

        return jsonify({
            "success": True,
            "debug_info": debug_info
        }), 200

    except Exception as e:
        logger.error('❌ Debug JWT error: %s', str(e), exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }), 500


@bp.route('/jwt-config', methods=['GET'])
def jwt_config():
    """Check JWT configuration"""
    from flask import current_app

    try:
        config_info = {
            "JWT_SECRET_KEY_SET": bool(current_app.config.get('JWT_SECRET_KEY')),
            "JWT_ACCESS_TOKEN_EXPIRES": str(current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES')),
            "JWT_ALGORITHM": current_app.config.get('JWT_ALGORITHM', 'HS256'),
            "JWT_ERROR_MESSAGE_KEY": current_app.config.get('JWT_ERROR_MESSAGE_KEY'),
            "JWT_TOKEN_LOCATION": current_app.config.get('JWT_TOKEN_LOCATION', ['headers'])
        }

        logger.info('🔧 JWT Config: %s', config_info)

        return jsonify({
            "success": True,
            "jwt_config": config_info
        }), 200

    except Exception as e:
        logger.error('❌ JWT config error: %s', str(e), exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/verify-token', methods=['POST'])
@jwt_required()
def verify_token():
    """Verify if the current token is valid"""
    try:
        current_user_id = get_user_id_from_jwt()
        current_user_id_str = get_jwt_identity()

        if not current_user_id:
            return jsonify({
                "success": False,
                "error": "Invalid token",
                "error_code": "INVALID_TOKEN"
            }), 401

        # Optionally check if user still exists and is active
        user = auth_service.auth_repo.get_user_by(user_id=current_user_id)
        if not user or not user.is_active:
            return jsonify({
                "success": False,
                "error": "User not found or inactive",
                "error_code": "USER_INACTIVE"
            }), 401

        logger.info('Token verification successful for user_id: %s', current_user_id)
        return jsonify({
            "success": True,
            "data": {
                "user_id": current_user_id,
                "user_id_string": current_user_id_str,
                "valid": True
            }
        }), 200

    except Exception as e:
        logger.error('Token verification error: %s', str(e), exc_info=True)
        return jsonify({
            "success": False,
            "error": "Token verification failed",
            "error_code": "VERIFICATION_FAILED"
        }), 401


# Health check for auth service
@bp.route('/health', methods=['GET'])
def auth_health():
    """Health check for auth service"""
    try:
        # Test database connection
        db.session.execute('SELECT 1')

        return jsonify({
            "success": True,
            "service": "auth",
            "status": "healthy",
            "database": "connected",
            "endpoints": {
                "login": "/api/auth/login",
                "register": "/api/auth/register",
                "refresh": "/api/auth/refresh",
                "logout": "/api/auth/logout",
                "me": "/api/auth/me",
                "users": "/api/auth/users",
                "specializations": "/api/auth/specializations"
            }
        }), 200
    except Exception as e:
        logger.error('Auth health check failed: %s', str(e))
        return jsonify({
            "success": False,
            "service": "auth",
            "status": "unhealthy",
            "error": str(e)
        }), 500

# ✅ ALL ARTICLES-RELATED FUNCTIONS HAVE BEEN REMOVED
# Articles are now handled by /api/articles endpoints in articles_router.py
#
# This auth_router.py now only contains authentication-related endpoints:
# - POST /api/auth/login          - User login
# - POST /api/auth/register       - User registration
# - POST /api/auth/refresh        - Token refresh
# - POST /api/auth/logout         - User logout
# - GET  /api/auth/me             - Get current user info
# - GET  /api/auth/users          - Get all users
# - GET  /api/auth/specializations - Get doctor specializations
# - GET  /api/auth/debug-jwt      - Debug JWT token
# - GET  /api/auth/jwt-config     - Check JWT configuration
# - POST /api/auth/verify-token   - Verify token validity
# - GET  /api/auth/health         - Auth service health check