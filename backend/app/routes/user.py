"""
User profile management routes.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from app.services.database import DatabaseService
from app.utils.validators import validate_email, validate_password
from app.utils.exceptions import ValidationError, AuthenticationError

user_bp = Blueprint('user', __name__)


def get_db_service():
    """Get database service instance."""
    return DatabaseService()


@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile."""
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


@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile information."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        db_service = get_db_service()
        
        # Get current user
        current_user = db_service.get_user_by_id(user_id)
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Validate and prepare update data
        update_data = {}
        
        # Validate name
        if 'name' in data:
            name = data['name'].strip() if data['name'] else None
            if not name:
                return jsonify({'error': 'Name cannot be empty'}), 400
            if len(name) > 100:
                return jsonify({'error': 'Name must be less than 100 characters'}), 400
            update_data['name'] = name
        
        # Validate email
        if 'email' in data:
            email = data['email'].lower().strip() if data['email'] else None
            if not email:
                return jsonify({'error': 'Email cannot be empty'}), 400
            
            if not validate_email(email):
                return jsonify({'error': 'Invalid email format'}), 400
            
            # Check if email is already taken by another user
            existing_user = db_service.get_user_by_email(email)
            if existing_user and existing_user.id != user_id:
                return jsonify({'error': 'Email already in use'}), 400
            
            update_data['email'] = email
        
        # Update user profile
        if update_data:
            updated_user = db_service.update_user(user_id, **update_data)
            if not updated_user:
                return jsonify({'error': 'Failed to update profile'}), 500
        else:
            updated_user = current_user
        
        return jsonify({
            'user': updated_user.to_dict(),
            'message': 'Profile updated successfully'
        }), 200
        
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500


@user_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change user password."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate input
        if not all(k in data for k in ('current_password', 'new_password')):
            return jsonify({'error': 'Missing current_password or new_password'}), 400
        
        current_password = data['current_password']
        new_password = data['new_password']
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        # Validate new password strength
        if not validate_password(new_password):
            return jsonify({'error': 'New password must be at least 8 characters long'}), 400
        
        db_service = get_db_service()
        
        # Get current user
        current_user = db_service.get_user_by_id(user_id)
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify current password
        if not check_password_hash(current_user.password_hash, current_password):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Check if new password is different from current
        if check_password_hash(current_user.password_hash, new_password):
            return jsonify({'error': 'New password must be different from current password'}), 400
        
        # Update password
        success = db_service.update_user_password(user_id, new_password)
        if not success:
            return jsonify({'error': 'Failed to update password'}), 500
        
        return jsonify({
            'message': 'Password changed successfully'
        }), 200
        
    except AuthenticationError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500


@user_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get user statistics."""
    try:
        user_id = get_jwt_identity()
        db_service = get_db_service()
        
        # Verify user exists
        user = db_service.get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        stats = db_service.get_user_stats(user_id)
        
        return jsonify({
            'stats': stats
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500


# Error handlers for the user blueprint
@user_bp.errorhandler(ValidationError)
def handle_validation_error(e):
    return jsonify({'error': str(e)}), 400


@user_bp.errorhandler(AuthenticationError)
def handle_auth_error(e):
    return jsonify({'error': str(e)}), 401
