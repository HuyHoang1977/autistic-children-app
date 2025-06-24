from flask.cli import FlaskGroup
from flask_cors import CORS
from app import create_app
from app.extensions import db
from flask_migrate import Migrate

# Create Flask app
app = create_app()

# Configure CORS with detailed settings
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": [
            "Content-Type",
            "Authorization",
            "Access-Control-Allow-Credentials",
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Headers",
            "Access-Control-Allow-Methods"
        ],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# Initialize Flask-Migrate
migrate = Migrate(app, db)

# Create CLI group
cli = FlaskGroup(app)

@cli.command()
def create_db():
    """Create database tables."""
    with app.app_context():
        db.create_all()
        print("Database tables created!")

@cli.command()
def drop_db():
    """Drop database tables."""
    with app.app_context():
        db.drop_all()
        print("Database tables dropped!")

@cli.command()
def reset_db():
    """Reset database tables."""
    with app.app_context():
        db.drop_all()
        db.create_all()
        print("Database reset completed!")

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)