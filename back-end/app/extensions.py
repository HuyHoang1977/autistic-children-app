# app/extensions.py - COMPLETE EXTENSIONS CONFIGURATION
import logging
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate

logger = logging.getLogger(__name__)

# ✅ Initialize ALL extensions (including bcrypt)
db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()  # ✅ THIS WAS MISSING!
migrate = Migrate()

logger.info("✅ All extensions initialized: db, jwt, bcrypt, migrate")