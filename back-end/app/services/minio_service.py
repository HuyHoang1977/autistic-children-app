# app/services/minio_service.py - COMPLETE SERVICE
import os
import uuid
import logging
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from minio.error import S3Error
from app.config.minio_config import minio_config

logger = logging.getLogger(__name__)


class MinIOService:
    def __init__(self):
        self.client = minio_config.client
        self.buckets = minio_config.buckets
        self.endpoint = minio_config.endpoint
        self.public_endpoint = minio_config.public_endpoint

        logger.info(f"🔧 MinIO Service initialized - Public endpoint: http://{self.public_endpoint}")

    def upload_file(self, file, bucket_type='general', folder=''):
        """
        Upload file to MinIO and return public URL

        Args:
            file: File object from request (Werkzeug FileStorage)
            bucket_type: Type of bucket ('avatars', 'articles', 'medical', 'general')
            folder: Subfolder in bucket (optional)

        Returns:
            dict: {success: bool, file_url: str, bucket: str, object_name: str, error: str}
        """
        try:
            if not file or file.filename == '':
                return {'success': False, 'error': 'No file selected'}

            logger.info(f"📤 Starting upload: {file.filename}, bucket_type: {bucket_type}, folder: {folder}")

            # Validate file type
            if not self._allowed_file(file.filename):
                return {
                    'success': False,
                    'error': 'File type not supported. Only images allowed: PNG, JPG, JPEG, GIF, WEBP, BMP'
                }

            # Generate unique filename
            filename = secure_filename(file.filename)
            file_extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpg'
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_id = str(uuid.uuid4())[:8]
            unique_filename = f"{timestamp}_{unique_id}.{file_extension}"

            # Create object name with folder
            if folder:
                folder = secure_filename(folder)
                object_name = f"{folder}/{unique_filename}"
            else:
                object_name = unique_filename

            bucket_name = self.buckets.get(bucket_type, self.buckets['general'])

            # Ensure bucket exists
            if not self.client.bucket_exists(bucket_name):
                logger.warning(f"⚠️  Bucket {bucket_name} does not exist, creating...")
                self.client.make_bucket(bucket_name)
                minio_config._set_bucket_policy(bucket_name)

            # Get file data and size
            file.seek(0)  # Reset file pointer
            file_data = file.read()
            file_size = len(file_data)

            logger.info(f"📊 File details: name={unique_filename}, size={file_size} bytes")

            # Upload file to MinIO
            from io import BytesIO
            file_stream = BytesIO(file_data)

            # Determine content type
            content_type = file.content_type or self._get_content_type(file_extension)

            self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=file_stream,
                length=file_size,
                content_type=content_type
            )

            # Generate correct public URL
            file_url = f"http://{self.public_endpoint}/{bucket_name}/{object_name}"

            logger.info(f"✅ Upload successful: {file_url}")

            return {
                'success': True,
                'file_url': file_url,
                'bucket': bucket_name,
                'object_name': object_name,
                'original_filename': filename,
                'file_size': file_size,
                'content_type': content_type
            }

        except S3Error as e:
            logger.error(f"❌ MinIO S3 error during upload: {e}")
            return {'success': False, 'error': f'MinIO error: {str(e)}'}
        except Exception as e:
            logger.error(f"❌ Unexpected upload error: {e}", exc_info=True)
            return {'success': False, 'error': f'Upload failed: {str(e)}'}

    def delete_file(self, bucket_name, object_name):
        """Delete file from MinIO"""
        try:
            logger.info(f"🗑️ Deleting: bucket={bucket_name}, object={object_name}")
            self.client.remove_object(bucket_name, object_name)
            logger.info(f"✅ Delete successful")
            return {'success': True}
        except S3Error as e:
            logger.error(f"❌ MinIO delete error: {e}")
            return {'success': False, 'error': f'Delete failed: {str(e)}'}
        except Exception as e:
            logger.error(f"❌ Unexpected delete error: {e}")
            return {'success': False, 'error': f'Delete failed: {str(e)}'}

    def delete_file_by_url(self, file_url):
        """Delete file by URL"""
        try:
            logger.info(f"🗑️ Deleting by URL: {file_url}")

            # Parse URL to get bucket and object name
            url_parts = file_url

            # Remove protocol and domain
            for prefix in [
                f"http://{self.public_endpoint}/",
                f"https://{self.public_endpoint}/",
                f"http://localhost:9000/",
                f"http://minio:9000/",
                "http://127.0.0.1:9000/"
            ]:
                if url_parts.startswith(prefix):
                    url_parts = url_parts[len(prefix):]
                    break

            # Split bucket and object
            parts = url_parts.split("/", 1)
            if len(parts) != 2:
                logger.error(f"❌ Invalid URL format: {file_url}")
                return {'success': False, 'error': 'Invalid URL format'}

            bucket_name, object_name = parts
            logger.info(f"🗑️ Parsed URL: bucket={bucket_name}, object={object_name}")

            return self.delete_file(bucket_name, object_name)

        except Exception as e:
            logger.error(f"❌ Parse URL error: {e}")
            return {'success': False, 'error': f'URL parsing failed: {str(e)}'}

    def get_presigned_url(self, bucket_name, object_name, expires=timedelta(hours=1)):
        """Generate presigned URL for private access"""
        try:
            url = self.client.presigned_get_object(bucket_name, object_name, expires=expires)
            logger.info(f"✅ Generated presigned URL for {object_name}")
            return url
        except S3Error as e:
            logger.error(f"❌ Presigned URL error: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Unexpected presigned URL error: {e}")
            return None

    def list_files(self, bucket_type='general', prefix=''):
        """List files in bucket"""
        try:
            bucket_name = self.buckets.get(bucket_type, self.buckets['general'])
            logger.info(f"📋 Listing files: bucket={bucket_name}, prefix={prefix}")

            objects = self.client.list_objects(bucket_name, prefix=prefix, recursive=True)

            files = []
            for obj in objects:
                file_url = f"http://{self.public_endpoint}/{bucket_name}/{obj.object_name}"
                files.append({
                    'name': obj.object_name,
                    'size': obj.size,
                    'last_modified': obj.last_modified.isoformat() if obj.last_modified else None,
                    'url': file_url,
                    'etag': obj.etag,
                    'bucket': bucket_name
                })

            logger.info(f"✅ Found {len(files)} files")
            return files

        except S3Error as e:
            logger.error(f"❌ List files S3 error: {e}")
            return []
        except Exception as e:
            logger.error(f"❌ List files error: {e}")
            return []

    def _allowed_file(self, filename):
        """Check if file type is allowed"""
        ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff', 'svg'}
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    def _get_content_type(self, file_extension):
        """Get MIME type for file extension"""
        content_types = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'bmp': 'image/bmp',
            'tiff': 'image/tiff',
            'svg': 'image/svg+xml'
        }
        return content_types.get(file_extension.lower(), 'application/octet-stream')

    def update_file(self, old_file_url, new_file, bucket_type='general', folder=''):
        """Update file: delete old and upload new"""
        logger.info(f"🔄 Updating file: old={old_file_url}")

        # Upload new file first
        upload_result = self.upload_file(new_file, bucket_type, folder)

        if not upload_result['success']:
            return upload_result

        # Delete old file if upload successful
        if old_file_url:
            delete_result = self.delete_file_by_url(old_file_url)
            if not delete_result['success']:
                logger.warning(f"⚠️  Failed to delete old file: {old_file_url}")

        logger.info(f"✅ File updated successfully")
        return upload_result

    def health_check(self):
        """Check MinIO service health"""
        try:
            # Test basic connection
            buckets = list(self.client.list_buckets())

            # Test bucket access
            bucket_status = {}
            for bucket_type, bucket_name in self.buckets.items():
                try:
                    exists = self.client.bucket_exists(bucket_name)
                    bucket_status[bucket_type] = {
                        'name': bucket_name,
                        'exists': exists,
                        'status': 'ok' if exists else 'missing'
                    }
                except Exception as e:
                    bucket_status[bucket_type] = {
                        'name': bucket_name,
                        'exists': False,
                        'status': 'error',
                        'error': str(e)
                    }

            return {
                'status': 'healthy',
                'endpoint': self.endpoint,
                'public_endpoint': f"http://{self.public_endpoint}",
                'total_buckets': len(buckets),
                'configured_buckets': bucket_status,
                'connection': 'ok'
            }

        except Exception as e:
            logger.error(f"❌ MinIO health check failed: {e}")
            return {
                'status': 'unhealthy',
                'endpoint': self.endpoint,
                'public_endpoint': f"http://{self.public_endpoint}",
                'error': str(e),
                'connection': 'failed'
            }


# Global service instance
minio_service = MinIOService()