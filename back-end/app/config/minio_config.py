# app/config/minio_config.py - AUTO SETUP ON IMPORT
import os
import json
import time
import logging
from minio import Minio
from minio.error import S3Error

logger = logging.getLogger(__name__)


class MinIOConfig:
    def __init__(self):
        # Configuration
        self.endpoint = os.getenv('MINIO_ENDPOINT', 'localhost:9000')
        self.public_endpoint = os.getenv('MINIO_PUBLIC_ENDPOINT', 'localhost:9000')
        self.access_key = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
        self.secret_key = os.getenv('MINIO_SECRET_KEY', 'minioadmin123')
        self.secure = os.getenv('MINIO_SECURE', 'False').lower() == 'true'

        logger.info(f"🔧 MinIO Config - Internal: {self.endpoint}, Public: {self.public_endpoint}")

        # Initialize client with retry
        self.client = self._init_client_with_retry()

        # Bucket configuration
        self.buckets = {
            'avatars': 'user-avatars',
            'articles': 'article-images',
            'medical': 'medical-attachments',
            'general': 'general-files'
        }

        # AUTO SETUP: Run immediately when imported
        self._auto_setup_buckets()

    def _init_client_with_retry(self, max_retries=5, delay=2):
        """Initialize MinIO client with retry logic"""
        for attempt in range(max_retries):
            try:
                client = Minio(
                    self.endpoint,
                    access_key=self.access_key,
                    secret_key=self.secret_key,
                    secure=self.secure
                )

                # Test connection
                client.list_buckets()
                logger.info("✅ MinIO client initialized successfully")
                return client

            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning(f"⚠️  MinIO connection attempt {attempt + 1} failed: {e}")
                    logger.info(f"⏳ Retrying in {delay} seconds...")
                    time.sleep(delay)
                    delay *= 2  # Exponential backoff
                else:
                    logger.error(f"❌ Failed to initialize MinIO after {max_retries} attempts: {e}")
                    raise

    def _auto_setup_buckets(self):
        """Automatically setup buckets and policies on initialization"""
        logger.info("🚀 Starting automatic MinIO bucket setup...")

        success_count = 0
        total_buckets = len(self.buckets)

        for bucket_type, bucket_name in self.buckets.items():
            try:
                logger.info(f"📦 Setting up bucket: {bucket_name}")

                # Create bucket if not exists
                if not self.client.bucket_exists(bucket_name):
                    self.client.make_bucket(bucket_name)
                    logger.info(f"✅ Created bucket: {bucket_name}")
                else:
                    logger.info(f"ℹ️  Bucket already exists: {bucket_name}")

                # Set public read policy
                self._set_bucket_policy(bucket_name)

                # Test bucket access
                list(self.client.list_objects(bucket_name, recursive=False))
                logger.info(f"✅ Bucket access verified: {bucket_name}")

                success_count += 1

            except Exception as e:
                logger.error(f"❌ Error setting up bucket {bucket_name}: {e}")

        # Summary
        if success_count == total_buckets:
            logger.info(f"🎉 All {total_buckets} buckets configured successfully!")
        else:
            logger.warning(f"⚠️  {total_buckets - success_count}/{total_buckets} buckets failed")

        # Show public URLs
        logger.info(f"📍 MinIO Public Endpoint: http://{self.public_endpoint}")
        logger.info(f"🖥️  MinIO Console: http://{self.public_endpoint.replace(':9000', ':9001')}")

    def _set_bucket_policy(self, bucket_name):
        """Set public read policy for bucket"""
        try:
            # PUBLIC READ POLICY
            policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": ["*"]},
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{bucket_name}/*"]
                    }
                ]
            }

            self.client.set_bucket_policy(bucket_name, json.dumps(policy))
            logger.info(f"✅ Set public read policy for: {bucket_name}")

        except S3Error as e:
            logger.warning(f"⚠️  Could not set policy for '{bucket_name}': {e}")
        except Exception as e:
            logger.error(f"❌ Unexpected error setting policy for '{bucket_name}': {e}")

    def get_public_url(self, bucket_name, object_name):
        """Get public URL for object"""
        return f"http://{self.public_endpoint}/{bucket_name}/{object_name}"

    def health_check(self):
        """Check MinIO connection health"""
        try:
            buckets = list(self.client.list_buckets())

            # Check each configured bucket
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
            return {
                'status': 'unhealthy',
                'endpoint': self.endpoint,
                'public_endpoint': f"http://{self.public_endpoint}",
                'error': str(e),
                'connection': 'failed'
            }


# AUTO SETUP: Global instance will auto-setup when imported
logger.info("🔧 Initializing MinIO configuration...")
minio_config = MinIOConfig()
logger.info("✅ MinIO configuration completed!")