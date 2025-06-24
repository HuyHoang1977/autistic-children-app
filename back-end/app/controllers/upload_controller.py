from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid
import os
from datetime import datetime, timedelta
from app.services.minio_service import minio_service
from app.extensions import db
import logging

logger = logging.getLogger(__name__)

upload_bp = Blueprint('uploads', __name__, url_prefix='/api/v1/uploads')

# Temporary storage for upload tracking
upload_tracking = {}


@upload_bp.route('/presigned-url', methods=['GET'])
@jwt_required()
def get_presigned_url():
    """
    Step 1: Generate presigned URL for direct upload to MinIO
    """
    try:
        user_id = get_jwt_identity()

        # Get parameters
        file_name = request.args.get('file_name')
        file_type = request.args.get('file_type')
        bucket_type = request.args.get('bucket_type', 'articles')

        if not file_name or not file_type:
            return jsonify({
                'success': False,
                'error': 'file_name and file_type are required'
            }), 400

        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
        if file_type not in allowed_types:
            return jsonify({
                'success': False,
                'error': 'File type not allowed'
            }), 400

        # Generate unique image ID
        image_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file_name)[1]
        unique_filename = f"{image_id}{file_extension}"

        # Create object name in tmp folder
        object_name = f"tmp/{unique_filename}"

        # Get bucket name
        bucket_name = minio_service.buckets.get(bucket_type, minio_service.buckets['general'])

        # Generate presigned URL for PUT operation
        presigned_url = minio_service.client.presigned_put_object(
            bucket_name,
            object_name,
            expires=timedelta(minutes=15)  # 15 minutes to upload
        )

        # Track upload for later confirmation
        upload_tracking[image_id] = {
            'user_id': user_id,
            'bucket_name': bucket_name,
            'object_name': object_name,
            'original_filename': file_name,
            'file_type': file_type,
            'bucket_type': bucket_type,
            'created_at': datetime.utcnow(),
            'status': 'pending'
        }

        logger.info(f'Generated presigned URL for user {user_id}: {image_id}')

        return jsonify({
            'success': True,
            'data': {
                'presigned_url': presigned_url,
                'image_id': image_id,
                'expires_in': 900  # 15 minutes in seconds
            }
        })

    except Exception as e:
        logger.error(f'Error generating presigned URL: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to generate upload URL'
        }), 500


@upload_bp.route('/confirm', methods=['POST'])
@jwt_required()
def confirm_upload():
    """
    Step 5: Confirm upload and move from tmp to main folder
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        image_id = data.get('image_id')

        if not image_id:
            return jsonify({
                'success': False,
                'error': 'image_id is required'
            }), 400

        # Check if upload is tracked
        if image_id not in upload_tracking:
            return jsonify({
                'success': False,
                'error': 'Upload not found or expired'
            }), 404

        upload_info = upload_tracking[image_id]

        # Verify user ownership
        if upload_info['user_id'] != user_id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 403

        # Check if file exists in tmp folder
        bucket_name = upload_info['bucket_name']
        tmp_object_name = upload_info['object_name']

        try:
            # Check if object exists
            minio_service.client.stat_object(bucket_name, tmp_object_name)
        except Exception as e:
            logger.error(f'File not found in tmp: {tmp_object_name}')
            return jsonify({
                'success': False,
                'error': 'File not found. Please upload again.'
            }), 404

        # Move from tmp/ to main folder
        file_extension = os.path.splitext(upload_info['original_filename'])[1]
        main_object_name = f"articles/{image_id}{file_extension}"

        # Copy object to main location
        copy_source = {
            'Bucket': bucket_name,
            'Key': tmp_object_name
        }

        minio_service.client.copy_object(
            bucket_name,
            main_object_name,
            copy_source
        )

        # Delete tmp file
        minio_service.client.remove_object(bucket_name, tmp_object_name)

        # Generate final URL
        final_url = f"http://{minio_service.endpoint}/{bucket_name}/{main_object_name}"

        # Update tracking status
        upload_tracking[image_id]['status'] = 'confirmed'
        upload_tracking[image_id]['final_object_name'] = main_object_name
        upload_tracking[image_id]['final_url'] = final_url

        logger.info(f'Upload confirmed for user {user_id}: {image_id}')

        return jsonify({
            'success': True,
            'data': {
                'image_url': final_url,
                'image_id': image_id
            }
        })

    except Exception as e:
        logger.error(f'Error confirming upload: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to confirm upload'
        }), 500


@upload_bp.route('/<image_id>', methods=['DELETE'])
@jwt_required()
def delete_image(image_id):
    """
    Delete uploaded image
    """
    try:
        user_id = get_jwt_identity()

        if image_id not in upload_tracking:
            return jsonify({
                'success': False,
                'error': 'Image not found'
            }), 404

        upload_info = upload_tracking[image_id]

        # Verify user ownership
        if upload_info['user_id'] != user_id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 403

        bucket_name = upload_info['bucket_name']

        # Delete main file if exists
        if upload_info.get('final_object_name'):
            try:
                minio_service.client.remove_object(bucket_name, upload_info['final_object_name'])
            except Exception as e:
                logger.warning(f'Could not delete main file: {e}')

        # Delete tmp file if exists
        if upload_info.get('object_name'):
            try:
                minio_service.client.remove_object(bucket_name, upload_info['object_name'])
            except Exception as e:
                logger.warning(f'Could not delete tmp file: {e}')

        # Remove from tracking
        del upload_tracking[image_id]

        logger.info(f'Image deleted for user {user_id}: {image_id}')

        return jsonify({
            'success': True,
            'message': 'Image deleted successfully'
        })

    except Exception as e:
        logger.error(f'Error deleting image: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to delete image'
        }), 500


@upload_bp.route('', methods=['GET'])
@jwt_required()
def list_uploads():
    """
    List user's uploads
    """
    try:
        user_id = get_jwt_identity()

        # Filter uploads by user
        user_uploads = {
            image_id: info for image_id, info in upload_tracking.items()
            if info['user_id'] == user_id
        }

        # Format response
        uploads = []
        for image_id, info in user_uploads.items():
            uploads.append({
                'image_id': image_id,
                'original_filename': info['original_filename'],
                'file_type': info['file_type'],
                'bucket_type': info['bucket_type'],
                'status': info['status'],
                'created_at': info['created_at'].isoformat(),
                'image_url': info.get('final_url')
            })

        return jsonify({
            'success': True,
            'data': uploads
        })

    except Exception as e:
        logger.error(f'Error listing uploads: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to list uploads'
        }), 500


# Cleanup function to remove expired uploads
def cleanup_expired_uploads():
    """
    Clean up expired upload tracking entries
    Should be called periodically (e.g., by a scheduler)
    """
    try:
        current_time = datetime.utcnow()
        expired_ids = []

        for image_id, info in upload_tracking.items():
            # Remove entries older than 1 hour
            if (current_time - info['created_at']).total_seconds() > 3600:
                expired_ids.append(image_id)

        for image_id in expired_ids:
            upload_info = upload_tracking[image_id]

            # Clean up tmp files for expired uploads
            if upload_info['status'] == 'pending':
                try:
                    minio_service.client.remove_object(
                        upload_info['bucket_name'],
                        upload_info['object_name']
                    )
                except Exception as e:
                    logger.warning(f'Could not clean up expired tmp file: {e}')

            del upload_tracking[image_id]

        if expired_ids:
            logger.info(f'Cleaned up {len(expired_ids)} expired uploads')

    except Exception as e:
        logger.error(f'Error cleaning up expired uploads: {str(e)}', exc_info=True)