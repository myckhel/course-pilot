"""
Flask extensions initialization.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()


def init_extensions(app):
    """Initialize Flask extensions with app instance."""
    db.init_app(app)
    migrate.init_app(app, db)
    
    with app.app_context():
        # Import models to ensure they are registered with SQLAlchemy
        from app.models import User, Topic, ChatSession, Message
        
        # Create tables if they don't exist
        db.create_all()
