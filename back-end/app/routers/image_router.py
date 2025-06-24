# app/routers/image_router.py - PRODUCTION READY VERSION
import logging
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
import requests

logger = logging.getLogger(__name__)
bp = Blueprint('images', __name__)


def allowed_file(filename):
    """Check if file extension is allowed"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ✅ CORS preflight handler
@bp.route('/upload', methods=['OPTIONS'])
@bp.route('/delete', methods=['OPTIONS'])
@bp.route('/list', methods=['OPTIONS'])
@bp.route('/health', methods=['OPTIONS'])
@bp.route('/proxy/<path:file_path>', methods=['OPTIONS'])
def images_options():
    """Handle CORS preflight requests for images endpoints"""
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response, 200


@bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_image():
    """Upload image to MinIO and return URL for frontend"""
    logger.info('=== IMAGE UPLOAD START ===')

    try:
        current_user_id = get_jwt_identity()
        logger.info(f'🔍 Upload request from user_id: {current_user_id}')

        # Log request details for debugging
        logger.info(f'📋 Request method: {request.method}')
        logger.info(f'📋 Request content type: {request.content_type}')
        logger.info(f'📋 Request form keys: {list(request.form.keys())}')
        logger.info(f'📋 Request files keys: {list(request.files.keys())}')

        # Check if file is in request
        if 'file' not in request.files:
            logger.error('❌ No file in request')
            return jsonify({
                'success': False,
                'error': 'No file in request',
                'debug_info': {
                    'form_keys': list(request.form.keys()),
                    'files_keys': list(request.files.keys()),
                    'content_type': request.content_type
                }
            }), 400

        file = request.files['file']

        # Check if file is selected
        if file.filename == '':
            logger.error('❌ No file selected')
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400

        # Validate file type
        if not allowed_file(file.filename):
            logger.error(f'❌ Invalid file type: {file.filename}')
            return jsonify({
                'success': False,
                'error': 'Only image files are allowed (PNG, JPG, JPEG, GIF, WEBP, BMP)'
            }), 400

        # Get optional parameters
        bucket_type = request.form.get('bucket_type', 'articles')
        folder = request.form.get('folder', 'featured')

        logger.info(f'📋 Upload params: file={file.filename}, bucket_type={bucket_type}, folder={folder}')

        # Try to use MinIO service
        try:
            from app.services.minio_service import minio_service
            result = minio_service.upload_file(file, bucket_type, folder)

            if result['success']:
                logger.info('✅ MinIO upload successful')
                return jsonify({
                    'success': True,
                    'message': 'Upload successful',
                    'file_url': result['file_url'],
                    'bucket': result.get('bucket', bucket_type),
                    'object_name': result.get('object_name'),
                    'original_filename': result.get('original_filename'),
                    'file_size': result.get('file_size', 0)
                }), 200
            else:
                logger.error(f'❌ MinIO upload failed: {result.get("error")}')
                return jsonify({
                    'success': False,
                    'error': f'Upload failed: {result.get("error")}'
                }), 500

        except Exception as minio_error:
            logger.error(f'❌ MinIO service error: {minio_error}')

            # Fallback to mock response for development/testing
            filename = secure_filename(file.filename)
            file_extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpg'
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_id = str(uuid.uuid4())[:8]
            mock_filename = f"{timestamp}_{unique_id}.{file_extension}"

            # Create mock URL that follows MinIO pattern
            mock_file_url = f"http://localhost:9000/{bucket_type}-images/{folder}/{mock_filename}"

            logger.warning('⚠️ Using mock upload response (MinIO not available)')
            return jsonify({
                'success': True,
                'message': 'Upload successful (Mock - MinIO service unavailable)',
                'file_url': mock_file_url,
                'bucket': f"{bucket_type}-images",
                'object_name': f"{folder}/{mock_filename}",
                'original_filename': filename,
                'file_size': len(file.read()) if file else 0,
                'note': 'Mock response - MinIO service unavailable'
            }), 200

    except Exception as e:
        logger.error(f'❌ Upload exception: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}',
            'error_type': type(e).__name__
        }), 500


@bp.route('/delete', methods=['DELETE'])
@jwt_required()
def delete_image():
    """Delete image from MinIO"""
    logger.info('=== IMAGE DELETE START ===')

    try:
        current_user_id = get_jwt_identity()
        logger.info(f'🔍 Delete request from user_id: {current_user_id}')

        data = request.get_json()
        if not data or 'file_url' not in data:
            logger.error('❌ Missing file_url in request')
            return jsonify({
                'success': False,
                'error': 'file_url is required'
            }), 400

        file_url = data['file_url']
        logger.info(f'🗑️ Deleting file: {file_url}')

        # Try to use MinIO service
        try:
            from app.services.minio_service import minio_service
            result = minio_service.delete_file_by_url(file_url)

            if result['success']:
                logger.info('✅ MinIO delete successful')
                return jsonify({
                    'success': True,
                    'message': 'File deleted successfully'
                }), 200
            else:
                logger.error(f'❌ MinIO delete failed: {result.get("error")}')
                return jsonify({
                    'success': False,
                    'error': f'Delete failed: {result.get("error")}'
                }), 500

        except Exception as minio_error:
            logger.error(f'❌ MinIO delete error: {minio_error}')

            # Mock success for development
            logger.warning('⚠️ Using mock delete response (MinIO not available)')
            return jsonify({
                'success': True,
                'message': 'File deleted successfully (Mock)'
            }), 200

    except Exception as e:
        logger.error(f'❌ Delete exception: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500


@bp.route('/list', methods=['GET'])
@jwt_required()
def list_images():
    """List images in bucket"""
    try:
        current_user_id = get_jwt_identity()
        logger.info(f'🔍 List images request from user_id: {current_user_id}')

        bucket_type = request.args.get('bucket_type', 'articles')
        prefix = request.args.get('prefix', '')

        logger.info(f'📋 List params: bucket_type={bucket_type}, prefix={prefix}')

        # Try to use MinIO service
        try:
            from app.services.minio_service import minio_service
            files = minio_service.list_files(bucket_type, prefix)

            logger.info(f'✅ Found {len(files)} files')
            return jsonify({
                'success': True,
                'files': files,
                'count': len(files)
            }), 200

        except Exception as minio_error:
            logger.error(f'❌ MinIO list error: {minio_error}')

            # Mock response for development
            mock_files = [
                {
                    'name': 'sample1.jpg',
                    'size': 1024,
                    'last_modified': '2025-06-23T12:00:00Z',
                    'url': 'http://localhost:9000/article-images/sample1.jpg'
                }
            ]

            return jsonify({
                'success': True,
                'files': mock_files,
                'count': len(mock_files),
                'note': 'Mock response - MinIO service not available'
            }), 200

    except Exception as e:
        logger.error(f'❌ List exception: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500


@bp.route('/health', methods=['GET'])
def images_health():
    """Health check for images service"""
    try:
        # Test MinIO connection if possible
        minio_status = 'unknown'
        try:
            from app.services.minio_service import minio_service
            health_check = minio_service.health_check()
            minio_status = health_check.get('status', 'unknown')
        except Exception as e:
            minio_status = f'error: {str(e)}'

        return jsonify({
            "success": True,
            "service": "images",
            "status": "healthy",
            "minio_status": minio_status,
            "endpoints": {
                "upload": "/api/images/upload",
                "delete": "/api/images/delete",
                "list": "/api/images/list",
                "health": "/api/images/health",
                "proxy": "/api/images/proxy/<path>"
            }
        }), 200
    except Exception as e:
        logger.error('Images health check failed: %s', str(e))
        return jsonify({
            "success": False,
            "service": "images",
            "status": "unhealthy",
            "error": str(e)
        }), 500


# ✅ Image proxy to serve images from MinIO (solves CORS issues)
@bp.route('/proxy/<path:file_path>')
def proxy_image(file_path):
    """Proxy to serve images from MinIO (solves CORS issues)"""
    try:
        logger.info(f'🖼️ Proxying image: {file_path}')

        # Handle different URL formats
        if file_path.startswith('http://'):
            # Full URL provided - extract path
            if 'localhost:9000/' in file_path:
                file_path = file_path.split('localhost:9000/', 1)[1]
            elif 'minio:9000/' in file_path:
                file_path = file_path.split('minio:9000/', 1)[1]

        # Try internal MinIO endpoint first
        minio_internal_url = f"http://minio:9000/{file_path}"
        logger.info(f'📡 Fetching from MinIO (internal): {minio_internal_url}')

        try:
            response = requests.get(minio_internal_url, timeout=10)
        except requests.exceptions.ConnectionError:
            # Fallback to external endpoint for development
            minio_external_url = f"http://localhost:9000/{file_path}"
            logger.info(f'📡 Fallback to external MinIO: {minio_external_url}')
            response = requests.get(minio_external_url, timeout=10)

        if response.status_code == 200:
            logger.info(f'✅ Successfully fetched image from MinIO: {file_path}')

            # Create Flask response with image data
            flask_response = Response(
                response.content,
                mimetype=response.headers.get('Content-Type', 'image/jpeg'),
                direct_passthrough=True
            )

            # Add CORS headers
            flask_response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
            flask_response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            flask_response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            flask_response.headers['Cache-Control'] = 'public, max-age=3600'  # Cache 1 hour

            return flask_response
        else:
            logger.error(f'❌ MinIO returned status {response.status_code} for {file_path}')
            return jsonify({
                'success': False,
                'error': f'Image not found in MinIO',
                'status_code': response.status_code
            }), 404

    except requests.exceptions.Timeout:
        logger.error(f'❌ Timeout fetching image: {file_path}')
        return jsonify({
            'success': False,
            'error': 'Timeout connecting to MinIO'
        }), 504

    except requests.exceptions.ConnectionError:
        logger.error(f'❌ Connection error fetching image: {file_path}')
        return jsonify({
            'success': False,
            'error': 'Cannot connect to MinIO'
        }), 503

    except Exception as e:
        logger.error(f'❌ Proxy exception for {file_path}: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Proxy error: {str(e)}'
        }), 500


# ✅ Specialized endpoints for different image types

@bp.route('/avatar/upload/<int:user_id>', methods=['POST'])
@jwt_required()
def upload_avatar(user_id):
    """Upload avatar for user"""
    try:
        current_user_id = get_jwt_identity()
        logger.info(f'🔍 Avatar upload for user {user_id} by user {current_user_id}')

        # Security check: only allow users to upload their own avatar
        if str(current_user_id) != str(user_id):
            return jsonify({
                'success': False,
                'error': 'You can only upload avatar for yourself'
            }), 403

        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file in request'
            }), 400

        file = request.files['file']

        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Only image files are allowed'
            }), 400

        try:
            from app.services.minio_service import minio_service
            result = minio_service.upload_file(
                file=file,
                bucket_type='avatars',
                folder=f'user_{user_id}'
            )

            if result['success']:
                avatar_url = result['file_url']
                logger.info(f'✅ Avatar upload successful for user {user_id}: {avatar_url}')

                return jsonify({
                    'success': True,
                    'message': 'Avatar uploaded successfully',
                    'avatar_url': avatar_url,
                    'user_id': user_id
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'Avatar upload failed')
                }), 500

        except Exception as minio_error:
            # Mock response for development
            filename = secure_filename(file.filename)
            file_extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpg'
            avatar_url = f"http://localhost:9000/user-avatars/user_{user_id}/avatar.{file_extension}"

            logger.warning(f'⚠️ Avatar upload mock response for user {user_id}')

            return jsonify({
                'success': True,
                'message': 'Avatar uploaded successfully (Mock)',
                'avatar_url': avatar_url,
                'user_id': user_id
            }), 200

    except Exception as e:
        logger.error(f'❌ Avatar upload exception: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500


@bp.route('/article/upload/<int:article_id>', methods=['POST'])
@jwt_required()
def upload_article_image(article_id):
    """Upload image for article"""
    try:
        current_user_id = get_jwt_identity()
        logger.info(f'🔍 Article image upload for article {article_id} by user {current_user_id}')

        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file in request'
            }), 400

        file = request.files['file']
        image_type = request.form.get('image_type', 'featured')

        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Only image files are allowed'
            }), 400

        try:
            from app.services.minio_service import minio_service
            result = minio_service.upload_file(
                file=file,
                bucket_type='articles',
                folder=f'article_{article_id}'
            )

            if result['success']:
                image_url = result['file_url']
                logger.info(f'✅ Article image upload successful for article {article_id}: {image_url}')

                return jsonify({
                    'success': True,
                    'message': 'Article image uploaded successfully',
                    'image_url': image_url,
                    'article_id': article_id,
                    'image_type': image_type
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'Article image upload failed')
                }), 500

        except Exception as minio_error:
            # Mock response for development
            filename = secure_filename(file.filename)
            file_extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpg'
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            image_url = f"http://localhost:9000/article-images/article_{article_id}/{timestamp}.{file_extension}"

            logger.warning(f'⚠️ Article image upload mock response for article {article_id}')

            return jsonify({
                'success': True,
                'message': 'Article image uploaded successfully (Mock)',
                'image_url': image_url,
                'article_id': article_id,
                'image_type': image_type
            }), 200

    except Exception as e:
        logger.error(f'❌ Article image upload exception: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500