"""
Authentication routes for user management.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.services.database import DatabaseService
from app.utils.validators import validate_email, validate_password
from app.utils.exceptions import ValidationError, AuthenticationError

auth_bp = Blueprint('auth', __name__)


def get_db_service():
    """Get database service instance."""
    return DatabaseService()


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        
        # Validate input
        if not all(k in data for k in ('name', 'email', 'password', 'role')):
            return jsonify({'error': 'Missing required fields: name, email, password, role'}), 400
        
        # Validate email format
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        if not validate_password(data['password']):
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
        # Validate role
        if data['role'] not in ['student', 'admin']:
            return jsonify({'error': 'Role must be either "student" or "admin"'}), 400
        
        db_service = get_db_service()
        
        # Check if user already exists
        if db_service.get_user_by_email(data['email']):
            return jsonify({'error': 'User with this email already exists'}), 400
        
        # Create user
        user = db_service.create_user(
            name=data['name'].strip(),
            email=data['email'].lower().strip(),
            password=data['password'],
            role=data['role']
        )
        
        # Generate access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'user': user.to_dict(),
            'token': access_token,
            'message': 'User registered successfully'
        }), 201
        
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return token."""
    try:
        data = request.get_json()
        
        if not all(k in data for k in ('email', 'password')):
            return jsonify({'error': 'Missing email or password'}), 400
        
        db_service = get_db_service()
        
        # Authenticate user
        user = db_service.authenticate_user(
            data['email'].lower().strip(), 
            data['password']
        )
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Generate access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'user': user.to_dict(),
            'token': access_token,
            'message': 'Login successful'
        }), 200
        
    except AuthenticationError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user information."""
    try:
        user_id = get_jwt_identity()
        db_service = get_db_service()
        
        user = db_service.get_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh_token():
    """Refresh the access token."""
    try:
        user_id = get_jwt_identity()
        db_service = get_db_service()
        
        # Verify user still exists
        user = db_service.get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Generate new access token
        new_token = create_access_token(identity=user_id)
        
        return jsonify({
            'token': new_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side token removal)."""
    # In a real application, you might want to implement token blacklisting
    # For now, we'll just return a success message as token removal is handled client-side
    return jsonify({'message': 'Logout successful'}), 200


# Error handlers for the auth blueprint
@auth_bp.errorhandler(ValidationError)
def handle_validation_error(e):
    return jsonify({'error': str(e)}), 400


@auth_bp.errorhandler(AuthenticationError)
def handle_auth_error(e):
    return jsonify({'error': str(e)}), 401
