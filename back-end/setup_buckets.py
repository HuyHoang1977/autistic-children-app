import json
import sys
import logging
from app.config.minio_config import minio_config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def setup_minio_buckets():
    """Setup MinIO buckets with public read policies"""
    logger.info("🚀 Starting MinIO bucket setup...")

    client = minio_config.client
    buckets = minio_config.buckets

    success_count = 0
    total_buckets = len(buckets)

    for bucket_type, bucket_name in buckets.items():
        try:
            logger.info(f"📦 Setting up bucket: {bucket_name} (type: {bucket_type})")

            # Create bucket if not exists
            if not client.bucket_exists(bucket_name):
                client.make_bucket(bucket_name)
                logger.info(f"✅ Created bucket: {bucket_name}")
            else:
                logger.info(f"ℹ️  Bucket already exists: {bucket_name}")

            # Set public read policy
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

            client.set_bucket_policy(bucket_name, json.dumps(policy))
            logger.info(f"✅ Set public read policy for: {bucket_name}")

            # Test bucket access
            try:
                list(client.list_objects(bucket_name, recursive=False))
                logger.info(f"✅ Bucket access test passed: {bucket_name}")
            except Exception as e:
                logger.warning(f"⚠️  Bucket access test failed for {bucket_name}: {e}")

            success_count += 1

        except Exception as e:
            logger.error(f"❌ Error setting up bucket {bucket_name}: {e}")

    # Summary
    logger.info(f"📊 Bucket setup complete: {success_count}/{total_buckets} successful")

    if success_count == total_buckets:
        logger.info("🎉 All buckets configured successfully!")
        return True
    else:
        logger.warning(f"⚠️  {total_buckets - success_count} buckets failed to configure")
        return False


def test_bucket_access():
    """Test access to all configured buckets"""
    logger.info("🧪 Testing bucket access...")

    client = minio_config.client
    buckets = minio_config.buckets
    public_endpoint = minio_config.public_endpoint

    for bucket_type, bucket_name in buckets.items():
        try:
            # Test bucket existence
            exists = client.bucket_exists(bucket_name)
            logger.info(f"📦 Bucket {bucket_name}: {'exists' if exists else 'missing'}")

            if exists:
                # Test listing objects
                objects = list(client.list_objects(bucket_name, recursive=False))
                logger.info(f"📋 Objects in {bucket_name}: {len(objects)}")

                # Show example public URL
                example_url = f"http://{public_endpoint}/{bucket_name}/example-image.jpg"
                logger.info(f"🔗 Example public URL: {example_url}")

        except Exception as e:
            logger.error(f"❌ Error testing bucket {bucket_name}: {e}")


def upload_test_image():
    """Upload a test image to verify upload functionality"""
    logger.info("🧪 Testing image upload...")

    try:
        from app.services.minio_service import minio_service

        # Create a simple test image (1x1 pixel PNG)
        import io
        from PIL import Image

        # Create test image
        img = Image.new('RGB', (1, 1), color='red')
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)

        # Create a mock file object
        class MockFile:
            def __init__(self, data, filename):
                self.data = data
                self.filename = filename
                self.content_type = 'image/png'

            def read(self):
                return self.data

            def seek(self, pos):
                pass

        test_file = MockFile(img_buffer.getvalue(), 'test-image.png')

        # Test upload
        result = minio_service.upload_file(test_file, 'articles', 'test')

        if result['success']:
            logger.info(f"✅ Test upload successful: {result['file_url']}")

            # Test delete
            delete_result = minio_service.delete_file_by_url(result['file_url'])
            if delete_result['success']:
                logger.info("✅ Test delete successful")
            else:
                logger.warning(f"⚠️  Test delete failed: {delete_result['error']}")
        else:
            logger.error(f"❌ Test upload failed: {result['error']}")

    except ImportError:
        logger.info("ℹ️  PIL not available, skipping image upload test")
    except Exception as e:
        logger.error(f"❌ Test upload error: {e}")


def main():
    """Main setup function"""
    try:
        logger.info("=" * 60)
        logger.info("🔧 MinIO Setup Script")
        logger.info("=" * 60)

        # Health check first
        health = minio_config.health_check()
        logger.info(f"🏥 MinIO Health: {health['status']}")

        if health['status'] != 'healthy':
            logger.error(f"❌ MinIO is not healthy: {health.get('error', 'Unknown error')}")
            sys.exit(1)

        # Setup buckets
        setup_success = setup_minio_buckets()

        if setup_success:
            logger.info("✅ Setup completed successfully!")

            # Test access
            test_bucket_access()

            # Test upload/delete
            upload_test_image()

            logger.info("=" * 60)
            logger.info("🎉 MinIO is ready for use!")
            logger.info(f"📍 Public endpoint: http://{minio_config.public_endpoint}")
            logger.info(f"🖥️  Console: http://{minio_config.public_endpoint.replace(':9000', ':9001')}")
            logger.info("📝 Configured buckets:")
            for bucket_type, bucket_name in minio_config.buckets.items():
                logger.info(f"   - {bucket_type}: {bucket_name}")
            logger.info("=" * 60)
        else:
            logger.error("❌ Setup failed!")
            sys.exit(1)

    except Exception as e:
        logger.error(f"❌ Setup script failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()