# SỬA FILE: app/services/minio_service.py
# Thay đổi endpoint để trả về localhost thay vì minio hostname

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
        # ✅ THÊM: Public endpoint cho frontend
        self.public_endpoint = "localhost:9000"  # Frontend accessible URL

    def upload_file(self, file, bucket_type='general', folder=''):
        """
        Upload file lên MinIO
        Args:
            file: File object từ request (Werkzeug FileStorage)
            bucket_type: Loại bucket ('avatars', 'articles', 'medical', 'general')
            folder: Folder con trong bucket (optional)
        Returns:
            dict: {success: bool, file_url: str, bucket: str, object_name: str, original_filename: str, error: str}
        """
        try:
            if not file or file.filename == '':
                return {'success': False, 'error': 'Không có file được chọn'}

            logger.info(f"📤 Starting upload: {file.filename}, type: {bucket_type}, folder: {folder}")

            # Validate file type
            if not self._allowed_file(file.filename):
                return {'success': False,
                        'error': 'Loại file không được hỗ trợ. Chỉ chấp nhận: png, jpg, jpeg, gif, webp'}

            # Tạo tên file unique
            filename = secure_filename(file.filename)
            file_extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

            # Generate unique filename with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_id = str(uuid.uuid4())[:8]  # Shorter UUID
            unique_filename = f"{timestamp}_{unique_id}.{file_extension}"

            # Tạo object name với folder
            if folder:
                folder = secure_filename(folder)
                object_name = f"{folder}/{unique_filename}"
            else:
                object_name = unique_filename

            bucket_name = self.buckets.get(bucket_type, self.buckets['general'])

            logger.info(f"📋 Upload details: bucket={bucket_name}, object={object_name}")

            # Get file data and size
            file.seek(0)  # Reset file pointer
            file_data = file.read()
            file_size = len(file_data)

            logger.info(f"📊 File size: {file_size} bytes")

            # Upload file to MinIO
            from io import BytesIO
            file_stream = BytesIO(file_data)

            self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=file_stream,
                length=file_size,
                content_type=file.content_type or 'application/octet-stream'
            )

            # ✅ SỬA: Tạo URL để truy cập file với public endpoint
            file_url = f"http://{self.public_endpoint}/{bucket_name}/{object_name}"

            logger.info(f"✅ Upload successful: {file_url}")

            return {
                'success': True,
                'file_url': file_url,
                'bucket': bucket_name,
                'object_name': object_name,
                'original_filename': filename,
                'file_size': file_size
            }

        except S3Error as e:
            logger.error(f"❌ MinIO S3 error: {e}")
            return {'success': False, 'error': f'Lỗi MinIO: {str(e)}'}
        except Exception as e:
            logger.error(f"❌ Upload error: {e}")
            return {'success': False, 'error': f'Lỗi upload: {str(e)}'}

    def delete_file(self, bucket_name, object_name):
        """
        Xóa file từ MinIO
        Args:
            bucket_name: Tên bucket
            object_name: Tên object trong bucket
        Returns:
            dict: {success: bool, error: str}
        """
        try:
            logger.info(f"🗑️ Deleting: bucket={bucket_name}, object={object_name}")
            self.client.remove_object(bucket_name, object_name)
            logger.info(f"✅ Delete successful")
            return {'success': True}
        except S3Error as e:
            logger.error(f"❌ MinIO delete error: {e}")
            return {'success': False, 'error': f'Lỗi xóa file: {str(e)}'}
        except Exception as e:
            logger.error(f"❌ Delete error: {e}")
            return {'success': False, 'error': f'Lỗi xóa file: {str(e)}'}

    def delete_file_by_url(self, file_url):
        """
        Xóa file bằng URL
        Args:
            file_url: URL của file
        Returns:
            dict: {success: bool, error: str}
        """
        try:
            logger.info(f"🗑️ Deleting by URL: {file_url}")

            # ✅ SỬA: Parse URL để lấy bucket và object name với cả 2 endpoint
            # URL format: http://localhost:9000/bucket_name/object_name
            # or http://minio:9000/bucket_name/object_name
            url_parts = file_url.replace(f"http://{self.public_endpoint}/", "")
            url_parts = url_parts.replace(f"http://{self.endpoint}/", "")  # Handle internal endpoint too

            parts = url_parts.split("/", 1)
            if len(parts) != 2:
                logger.error(f"❌ Invalid URL format: {file_url}")
                return {'success': False, 'error': 'URL không hợp lệ'}

            bucket_name, object_name = parts
            logger.info(f"🗑️ Parsed URL: bucket={bucket_name}, object={object_name}")

            return self.delete_file(bucket_name, object_name)

        except Exception as e:
            logger.error(f"❌ Parse URL error: {e}")
            return {'success': False, 'error': f'Lỗi parse URL: {str(e)}'}

    def get_presigned_url(self, bucket_name, object_name, expires=timedelta(hours=1)):
        """
        Tạo presigned URL để truy cập file
        Args:
            bucket_name: Tên bucket
            object_name: Tên object
            expires: Thời gian hết hạn (default 1 giờ)
        Returns:
            str: Presigned URL hoặc None nếu lỗi
        """
        try:
            url = self.client.presigned_get_object(bucket_name, object_name, expires=expires)
            logger.info(f"✅ Generated presigned URL for {object_name}")
            return url
        except S3Error as e:
            logger.error(f"❌ Presigned URL error: {e}")
            return None

    def list_files(self, bucket_type='general', prefix=''):
        """
        Liệt kê files trong bucket
        Args:
            bucket_type: Loại bucket
            prefix: Prefix để filter (folder)
        Returns:
            list: Danh sách files
        """
        try:
            bucket_name = self.buckets.get(bucket_type, self.buckets['general'])
            logger.info(f"📋 Listing files: bucket={bucket_name}, prefix={prefix}")

            objects = self.client.list_objects(bucket_name, prefix=prefix, recursive=True)

            files = []
            for obj in objects:
                files.append({
                    'name': obj.object_name,
                    'size': obj.size,
                    'last_modified': obj.last_modified.isoformat() if obj.last_modified else None,
                    # ✅ SỬA: Sử dụng public endpoint
                    'url': f"http://{self.public_endpoint}/{bucket_name}/{obj.object_name}",
                    'etag': obj.etag
                })

            logger.info(f"✅ Found {len(files)} files")
            return files

        except S3Error as e:
            logger.error(f"❌ List files error: {e}")
            return []
        except Exception as e:
            logger.error(f"❌ List files error: {e}")
            return []

    def _allowed_file(self, filename):
        """Kiểm tra loại file được phép upload"""
        # Updated to include more image formats and remove non-image types for image upload
        ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff', 'svg'}
        return '.' in filename and \
            filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    def update_file(self, old_file_url, new_file, bucket_type='general', folder=''):
        """
        Cập nhật file: xóa file cũ và upload file mới
        Args:
            old_file_url: URL của file cũ
            new_file: File object mới
            bucket_type: Loại bucket
            folder: Folder trong bucket
        Returns:
            dict: Kết quả upload file mới
        """
        logger.info(f"🔄 Updating file: old={old_file_url}")

        # Upload file mới trước
        upload_result = self.upload_file(new_file, bucket_type, folder)

        if not upload_result['success']:
            return upload_result

        # Xóa file cũ nếu upload thành công
        if old_file_url:
            delete_result = self.delete_file_by_url(old_file_url)
            if not delete_result['success']:
                logger.warning(f"⚠️ Failed to delete old file: {old_file_url}")
                # Don't fail the whole operation if old file can't be deleted

        logger.info(f"✅ File updated successfully")
        return upload_result

    def health_check(self):
        """
        Kiểm tra tình trạng kết nối MinIO
        Returns:
            dict: Health status
        """
        try:
            # Test connection by listing buckets
            buckets = self.client.list_buckets()

            return {
                'status': 'healthy',
                'internal_endpoint': self.endpoint,
                'public_endpoint': self.public_endpoint,
                'buckets_count': len(buckets),
                'available_buckets': list(self.buckets.keys()),
                'configured_buckets': self.buckets
            }

        except Exception as e:
            logger.error(f"❌ MinIO health check failed: {e}")
            return {
                'status': 'unhealthy',
                'internal_endpoint': self.endpoint,
                'public_endpoint': self.public_endpoint,
                'error': str(e)
            }


# Khởi tạo service global
minio_service = MinIOService()