import os
import uuid
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from minio.error import S3Error
from app.config.minio_config import minio_config


class MinIOService:
    def __init__(self):
        self.client = minio_config.client
        self.buckets = minio_config.buckets

    def upload_file(self, file, bucket_type='general', folder=''):
        """
        Upload file lên MinIO
        Args:
            file: File object từ request
            bucket_type: Loại bucket ('avatars', 'articles', 'medical', 'general')
            folder: Folder con trong bucket (optional)
        Returns:
            dict: {success: bool, file_url: str, error: str}
        """
        try:
            if not file or file.filename == '':
                return {'success': False, 'error': 'Không có file được chọn'}

            # Validate file type
            if not self._allowed_file(file.filename):
                return {'success': False, 'error': 'Loại file không được hỗ trợ'}

            # Tạo tên file unique
            filename = secure_filename(file.filename)
            file_extension = filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4().hex}.{file_extension}"

            # Tạo object name với folder
            if folder:
                object_name = f"{folder}/{unique_filename}"
            else:
                object_name = unique_filename

            bucket_name = self.buckets.get(bucket_type, self.buckets['general'])

            # Upload file
            file.seek(0)  # Reset file pointer
            self.client.put_object(
                bucket_name,
                object_name,
                file,
                length=-1,  # Unknown length
                part_size=10 * 1024 * 1024,  # 10MB parts
                content_type=file.content_type
            )

            # Tạo URL để truy cập file
            file_url = f"http://{minio_config.endpoint}/{bucket_name}/{object_name}"

            return {
                'success': True,
                'file_url': file_url,
                'bucket': bucket_name,
                'object_name': object_name,
                'original_filename': filename
            }

        except S3Error as e:
            return {'success': False, 'error': f'Lỗi MinIO: {str(e)}'}
        except Exception as e:
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
            self.client.remove_object(bucket_name, object_name)
            return {'success': True}
        except S3Error as e:
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
            # Parse URL để lấy bucket và object name
            # URL format: http://127.0.0.1:9000/bucket_name/object_name
            url_parts = file_url.replace(f"http://{minio_config.endpoint}/", "").split("/", 1)
            if len(url_parts) != 2:
                return {'success': False, 'error': 'URL không hợp lệ'}

            bucket_name, object_name = url_parts
            return self.delete_file(bucket_name, object_name)
        except Exception as e:
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
            return url
        except S3Error as e:
            print(f"Lỗi tạo presigned URL: {e}")
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
            objects = self.client.list_objects(bucket_name, prefix=prefix, recursive=True)

            files = []
            for obj in objects:
                files.append({
                    'name': obj.object_name,
                    'size': obj.size,
                    'last_modified': obj.last_modified,
                    'url': f"http://{minio_config.endpoint}/{bucket_name}/{obj.object_name}"
                })
            return files
        except S3Error as e:
            print(f"Lỗi list files: {e}")
            return []

    def _allowed_file(self, filename):
        """Kiểm tra loại file được phép upload"""
        ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx'}
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
        # Xóa file cũ nếu có
        if old_file_url:
            self.delete_file_by_url(old_file_url)

        # Upload file mới
        return self.upload_file(new_file, bucket_type, folder)


# Khởi tạo service global
minio_service = MinIOService()