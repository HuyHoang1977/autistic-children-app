from flask.cli import FlaskGroup
from app import create_app
from app.extensions import db
from flask_migrate import Migrate
import logging

# Configure logging (optional - enhanced version)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create Flask app
logger.info("🚀 Initializing Flask application...")
app = create_app()

# Initialize Flask-Migrate
migrate = Migrate(app, db)

# Create CLI group
cli = FlaskGroup(app)


@cli.command()
def create_db():
    """Create database tables."""
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables created!")
            logger.info("✅ Database tables created!")
        except Exception as e:
            print(f"❌ Error creating database: {e}")
            logger.error(f"❌ Error creating database: {e}")


@cli.command()
def drop_db():
    """Drop database tables."""
    with app.app_context():
        try:
            db.drop_all()
            print("✅ Database tables dropped!")
            logger.info("✅ Database tables dropped!")
        except Exception as e:
            print(f"❌ Error dropping database: {e}")
            logger.error(f"❌ Error dropping database: {e}")


@cli.command()
def reset_db():
    """Reset database tables."""
    with app.app_context():
        try:
            db.drop_all()
            db.create_all()
            print("✅ Database reset completed!")
            logger.info("✅ Database reset completed!")
        except Exception as e:
            print(f"❌ Error resetting database: {e}")
            logger.error(f"❌ Error resetting database: {e}")


@cli.command()
def verify_minio():
    """Verify MinIO setup (optional - only if MinIO is configured)."""
    try:
        from app.config.minio_config import minio_config
        health = minio_config.health_check()

        print("🔍 MinIO Health Check:")
        print(f"Status: {health['status']}")
        print(f"Endpoint: {health.get('public_endpoint', 'Unknown')}")
        print(f"Buckets: {health.get('configured_buckets', {})}")

        if health['status'] == 'healthy':
            print("✅ MinIO verification passed!")
            logger.info("✅ MinIO verification passed!")
        else:
            print(f"❌ MinIO verification failed: {health.get('error')}")
            logger.error(f"❌ MinIO verification failed: {health.get('error')}")

    except ImportError:
        print("⚠️ MinIO not configured - skipping verification")
        logger.warning("⚠️ MinIO not configured - skipping verification")
    except Exception as e:
        print(f"❌ MinIO verification error: {e}")
        logger.error(f"❌ MinIO verification error: {e}")


@cli.command()
def test_db():
    """Test database connection."""
    with app.app_context():
        try:
            db.session.execute('SELECT 1')
            print("✅ Database connection test passed!")
            logger.info("✅ Database connection test passed!")
        except Exception as e:
            print(f"❌ Database connection test failed: {e}")
            logger.error(f"❌ Database connection test failed: {e}")


if __name__ == "__main__":
    # Run the Flask app
    print("🌐 Starting Flask development server...")
    print("📍 Server will be available at: http://localhost:5000")
    logger.info("🌐 Starting Flask development server...")
    app.run(host='0.0.0.0', port=5000, debug=True)