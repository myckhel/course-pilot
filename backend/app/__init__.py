"""
Flask application factory and configuration.
"""
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import Config
from app.extensions import init_extensions
from app.routes.auth import auth_bp
from app.routes.topics import topics_bp
from app.routes.documents import documents_bp
from app.routes.chat import chat_bp
from app.routes.admin import admin_bp
from app.routes.user import user_bp
from app.utils.logging import setup_logging


def create_app(config_name=None):
    """Create and configure Flask application."""
    app = Flask(__name__)
    
    # Load configuration
    if config_name:
        if config_name == 'testing':
            from app.config import TestingConfig
            app.config.from_object(TestingConfig)
        elif config_name == 'development':
            from app.config import DevelopmentConfig
            app.config.from_object(DevelopmentConfig)
        elif config_name == 'production':
            from app.config import ProductionConfig
            app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(Config)
    
    # Setup logging
    setup_logging(app)
    
    # Initialize extensions (SQLAlchemy, Migrate, etc.)
    init_extensions(app)
    
    # Initialize extensions
    CORS(app, origins=app.config.get('CORS_ORIGINS', '').split(','))
    jwt = JWTManager(app)
    
    # Custom JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'msg': 'Token has expired'}, 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'msg': 'Invalid token'}, 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {'msg': 'Authorization token is required'}, 401
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(topics_bp, url_prefix='/api/topics')
    app.register_blueprint(documents_bp, url_prefix='/api/documents')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'service': 'ai-teaching-assistant-backend'}
    
    # Global error handler
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Endpoint not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Server Error: {error}')
        return {'error': 'Internal server error'}, 500
    
    app.logger.info("Flask application created successfully")
    return app
