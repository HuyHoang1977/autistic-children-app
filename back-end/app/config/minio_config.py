import os
from minio import Minio
from minio.error import S3Error


class MinIOConfig:
    def __init__(self):
        self.endpoint = os.getenv('MINIO_ENDPOINT', '127.0.0.1:9000')
        self.access_key = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
        self.secret_key = os.getenv('MINIO_SECRET_KEY', 'minioadmin')
        self.secure = os.getenv('MINIO_SECURE', 'False').lower() == 'true'

        # Khởi tạo MinIO client
        self.client = Minio(
            self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure
        )

        # Tên các buckets
        self.buckets = {
            'avatars': 'user-avatars',
            'articles': 'article-images',
            'medical': 'medical-attachments',
            'general': 'general-files'
        }

        # Tạo buckets nếu chưa tồn tại
        self._create_buckets()

    def _create_buckets(self):
        """Tạo các buckets cần thiết"""
        for bucket_name in self.buckets.values():
            try:
                if not self.client.bucket_exists(bucket_name):
                    self.client.make_bucket(bucket_name)
                    print(f"Bucket '{bucket_name}' đã được tạo")
                else:
                    print(f"Bucket '{bucket_name}' đã tồn tại")
            except S3Error as e:
                print(f"Lỗi khi tạo bucket '{bucket_name}': {e}")


# Khởi tạo MinIO client global
minio_config = MinIOConfig()