"""
Authentication middleware for the application.
"""
from functools import wraps
from flask import request, jsonify, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.services.database import DatabaseService
from app.utils.exceptions import AuthenticationError, AuthorizationError


def require_auth(f):
    """Decorator to require authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Authentication required'}), 401
    return decorated_function


def require_admin(f):
    """Decorator to require admin role."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            
            user_id = get_jwt_identity()
            db_service = DatabaseService()
            user = db_service.get_user_by_id(user_id)
            
            if not user or user.role != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Authentication required'}), 401
    return decorated_function


def rate_limit(max_requests: int = 100, window_minutes: int = 60):
    """Basic rate limiting decorator (simplified implementation)."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # In a production environment, you would implement proper rate limiting
            # using Redis or a similar cache store
            # For now, we'll just pass through
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def validate_content_type(allowed_types: list = None):
    """Decorator to validate request content type."""
    if allowed_types is None:
        allowed_types = ['application/json']
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.content_type not in allowed_types:
                return jsonify({
                    'error': f'Content-Type must be one of: {", ".join(allowed_types)}'
                }), 400
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def log_request(f):
    """Decorator to log incoming requests."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # In production, you would use proper logging
        if current_app.debug:
            print(f"Request: {request.method} {request.path}")
        return f(*args, **kwargs)
    return decorated_function
