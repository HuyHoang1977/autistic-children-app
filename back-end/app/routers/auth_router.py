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
from app.models.articles_model import Article
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


# CORS preflight handler for articles
@bp.route('/articles', methods=['OPTIONS'])
def articles_options():
    """Handle CORS preflight requests"""
    logger.info('Handling OPTIONS request for /articles')
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response, 200


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


@bp.route('/articles', methods=['GET'])
def get_articles():
    """Get paginated articles with JWT authentication"""
    logger.info('=== GET ARTICLES START ===')

    try:
        # Step 1: JWT verification
        logger.info('🔍 Step 1: JWT verification...')

        try:
            verify_jwt_in_request()
            current_user_id_str = get_jwt_identity()  # String from JWT
            current_user_id = get_user_id_from_jwt()  # Integer for DB

            if not current_user_id:
                logger.error('❌ No valid user ID found in JWT')
                return jsonify({
                    "success": False,
                    "error": "Invalid user identity in JWT token",
                    "error_code": "INVALID_USER_IDENTITY"
                }), 422

            logger.info('✅ JWT verified successfully for user_id: %d (from string: %s)', current_user_id,
                        current_user_id_str)

        except Exception as jwt_error:
            logger.error('❌ JWT Verification failed: %s', str(jwt_error))

            error_message = str(jwt_error).lower()
            if 'signature' in error_message:
                error_code = 'INVALID_SIGNATURE'
                user_message = 'JWT signature verification failed'
            elif 'expired' in error_message:
                error_code = 'TOKEN_EXPIRED'
                user_message = 'JWT token has expired'
            elif 'decode' in error_message or 'format' in error_message:
                error_code = 'INVALID_TOKEN_FORMAT'
                user_message = 'JWT token format is invalid'
            elif 'subject' in error_message or 'string' in error_message:
                error_code = 'INVALID_SUBJECT_FORMAT'
                user_message = 'JWT subject format is invalid - please login again'
            else:
                error_code = 'JWT_VERIFICATION_FAILED'
                user_message = f'JWT verification failed: {str(jwt_error)}'

            return jsonify({
                "success": False,
                "error": user_message,
                "error_code": error_code
            }), 422

        # Step 2: Get and validate parameters
        logger.info('🔍 Step 2: Validating parameters...')
        try:
            limit = request.args.get('limit', default=10, type=int)
            page = request.args.get('page', default=1, type=int)
            logger.info('📋 Parameters - limit: %d, page: %d', limit, page)
        except (ValueError, TypeError) as param_error:
            logger.error('❌ Parameter validation failed: %s', str(param_error))
            return jsonify({
                "success": False,
                "error": "Invalid parameters. Limit and page must be integers.",
                "error_code": "INVALID_PARAMETERS"
            }), 422

        # Step 3: Validate parameter ranges
        if not (1 <= limit <= 100):
            logger.error('❌ Invalid limit: %d', limit)
            return jsonify({
                "success": False,
                "error": f"Limit must be between 1 and 100, got: {limit}",
                "error_code": "INVALID_LIMIT"
            }), 422

        if page < 1:
            logger.error('❌ Invalid page: %d', page)
            return jsonify({
                "success": False,
                "error": f"Page must be greater than 0, got: {page}",
                "error_code": "INVALID_PAGE"
            }), 422

        # Step 4: Check database connection and Article model
        logger.info('🔍 Step 3: Testing database and Article model...')
        try:
            article_count = db.session.query(Article).count()
            logger.info('📊 Total articles in database: %d', article_count)
        except Exception as model_error:
            logger.error('❌ Article model/database error: %s', str(model_error), exc_info=True)
            return jsonify({
                "success": True,
                "data": [],
                "pagination": {
                    "current_page": page,
                    "per_page": limit,
                    "total": 0,
                    "total_pages": 0,
                    "has_more": False
                },
                "message": "Database connection issue - returning empty result"
            }), 200

        # Step 5: Query articles with pagination
        logger.info('🔍 Step 4: Querying articles...')
        try:
            offset = (page - 1) * limit
            logger.info('📊 Query parameters - offset: %d, limit: %d', offset, limit)

            articles_query = db.session.query(Article).order_by(Article.created_at.desc())
            articles = articles_query.offset(offset).limit(limit).all()

            logger.info('✅ Query successful - retrieved %d articles', len(articles))

        except Exception as query_error:
            logger.error('❌ Database query failed: %s', str(query_error), exc_info=True)
            return jsonify({
                "success": True,
                "data": [],
                "pagination": {
                    "current_page": page,
                    "per_page": limit,
                    "total": 0,
                    "total_pages": 0,
                    "has_more": False
                },
                "message": "Database query failed"
            }), 200

        # Step 6: Serialize articles
        logger.info('🔍 Step 5: Serializing articles...')
        try:
            paginated_articles = []

            for i, article in enumerate(articles):
                try:
                    # Use Article model's to_dict method if available, otherwise manual serialization
                    if hasattr(article, 'to_dict') and callable(getattr(article, 'to_dict')):
                        article_data = article.to_dict()
                        logger.debug('✅ Used article.to_dict() for article %d', i)
                    else:
                        # Manual serialization with safe attribute access
                        article_data = {
                            "id": getattr(article, 'article_id', i + 1),
                            "article_id": getattr(article, 'article_id', i + 1),
                            "title": getattr(article, 'title', f'Article {i + 1}'),
                            "content": getattr(article, 'content', '') or getattr(article, 'content_body', ''),
                            "excerpt": getattr(article, 'excerpt', ''),
                            "author_id": getattr(article, 'author_id', current_user_id),
                            "created_at": getattr(article, 'created_at', '').isoformat() if hasattr(article,
                                                                                                    'created_at') and getattr(
                                article, 'created_at') else '2025-06-21T12:00:00Z',
                            "updated_at": getattr(article, 'updated_at', '').isoformat() if hasattr(article,
                                                                                                    'updated_at') and getattr(
                                article, 'updated_at') else None,
                            "status": getattr(article, 'status', 'published'),
                            "featured": getattr(article, 'featured', False),
                            "category": getattr(article, 'category', 'General'),
                            "interactions": {
                                "likes": getattr(article, 'like_count', 0) or 0,
                                "views": getattr(article, 'views', 0) or 0,
                                "shares": getattr(article, 'share_count', 0) or 0,
                                "comments_count": getattr(article, 'comment_count', 0) or 0
                            },
                            "userInteractions": {
                                "isLiked": False,
                                "isSaved": False,
                                "hasViewed": False
                            }
                        }
                        logger.debug('✅ Manual serialization for article %d', i)

                    paginated_articles.append(article_data)

                except Exception as article_error:
                    logger.error('❌ Failed to serialize article %d: %s', i, str(article_error))
                    # Continue with other articles
                    continue

            logger.info('✅ Successfully serialized %d articles', len(paginated_articles))

        except Exception as serialization_error:
            logger.error('❌ Article serialization failed: %s', str(serialization_error), exc_info=True)
            return jsonify({
                "success": True,
                "data": [],
                "pagination": {
                    "current_page": page,
                    "per_page": limit,
                    "total": 0,
                    "total_pages": 0,
                    "has_more": False
                },
                "message": "Article serialization failed"
            }), 200

        # Step 7: Prepare response
        has_more = len(articles) == limit and (offset + limit) < article_count
        total_pages = (article_count + limit - 1) // limit if article_count > 0 else 1

        response_data = {
            "success": True,
            "data": paginated_articles,
            "pagination": {
                "current_page": page,
                "per_page": limit,
                "total": article_count,
                "total_pages": total_pages,
                "has_more": has_more
            },
            "debug_info": {
                "user_id": current_user_id,
                "user_id_string": current_user_id_str,
                "articles_count": len(paginated_articles),
                "query_offset": offset
            }
        }

        logger.info('📤 Successfully returning response with %d articles', len(paginated_articles))
        logger.info('📊 Pagination: page %d/%d, total %d', page, total_pages, article_count)
        logger.info('=== GET ARTICLES SUCCESS ===')

        return jsonify(response_data), 200

    except Exception as unexpected_error:
        logger.error('❌ Unexpected error in get_articles: %s', str(unexpected_error), exc_info=True)
        return jsonify({
            "success": False,
            "error": f"Unexpected server error: {str(unexpected_error)}",
            "error_code": "UNEXPECTED_ERROR"
        }), 500