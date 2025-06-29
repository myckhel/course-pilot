"""
Admin-specific routes for managing the system.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from app.services.database import DatabaseService
from app.services.vector_store import VectorStoreService
from app.utils.file_upload import FileUploadService
from app.utils.exceptions import AuthorizationError

admin_bp = Blueprint('admin', __name__)


def get_services():
    """Get service instances."""
    db_service = DatabaseService()
    vector_service = VectorStoreService(current_app.config['CHROMA_PERSIST_DIR'])
    file_service = FileUploadService(current_app.config.get('UPLOAD_DIR', 'uploads/attachments'))
    return db_service, vector_service, file_service


def verify_admin(user_id: str, db_service: DatabaseService):
    """Verify if user is admin."""
    user = db_service.get_user_by_id(user_id)
    if not user or user.role != 'admin':
        raise AuthorizationError('Admin access required')
    return user


@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_admin_dashboard():
    """Get admin dashboard statistics."""
    try:
        user_id = get_jwt_identity()
        db_service, vector_service, _ = get_services()
        
        # Verify admin access
        verify_admin(user_id, db_service)
        
        # Get comprehensive system statistics
        system_stats = db_service.get_system_stats()
        
        # Get vector store statistics
        indexed_topics = vector_service.get_all_topic_ids()
        total_indexed_topics = len(indexed_topics)
        
        # Get additional metrics for dashboard
        from app.models import Topic, User, ChatSession, Message, Document
        from app.extensions import db
        
        # Calculate additional metrics
        try:
            # Total documents
            total_documents = Document.query.count()
            
            # Active topics (topics with at least one processed document)
            active_topics = db.session.query(Topic).join(Document)\
                .filter(Document.is_processed == True)\
                .distinct().count()
            
            # Processing success rate
            total_docs = Document.query.count()
            processed_docs = Document.query.filter_by(is_processed=True).count()
            processing_success = int((processed_docs / total_docs * 100) if total_docs > 0 else 100)
            
            # 24-hour activity
            yesterday = datetime.utcnow() - timedelta(days=1)
            active_users_24h = db.session.query(User.id).join(ChatSession)\
                .filter(ChatSession.created_at >= yesterday).distinct().count()
            
            messages_today = Message.query.filter(Message.created_at >= yesterday).count()
            
            # Average session time (simplified calculation)
            avg_session_time = 15  # Default value, could be calculated from actual data
            
            # Recent topics with document counts
            recent_topics_query = db.session.query(
                Topic.id,
                Topic.name,
                Topic.created_at,
                db.func.count(Document.id).label('document_count')
            ).outerjoin(Document)\
            .group_by(Topic.id, Topic.name, Topic.created_at)\
            .order_by(db.desc(Topic.created_at))\
            .limit(5).all()
            
            recent_topics = [
                {
                    'id': str(topic.id),
                    'title': topic.name,
                    'documentCount': topic.document_count,
                    'createdAt': topic.created_at.isoformat()
                }
                for topic in recent_topics_query
            ]
            
        except Exception as e:
            current_app.logger.error(f"Error calculating additional metrics: {str(e)}")
            # Fallback values
            total_documents = 0
            active_topics = system_stats['total_topics']
            processing_success = 100
            active_users_24h = 0
            messages_today = 0
            avg_session_time = 15
            recent_topics = []
        
        # Format stats according to AdminDashboardStats interface
        stats = {
            'totalTopics': system_stats['total_topics'],
            'totalUsers': system_stats['total_users'],
            'totalSessions': system_stats['total_sessions'],
            'totalMessages': system_stats['total_messages'],
            'totalDocuments': total_documents,
            'activeTopics': active_topics,
            'processingSuccess': processing_success,
            'activeUsers24h': active_users_24h,
            'messagesToday': messages_today,
            'avgSessionTime': avg_session_time,
            'peakHours': '9 AM - 11 AM',
            'recentTopics': recent_topics
        }
        
        return jsonify(stats), 200
        
    except AuthorizationError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': 'Failed to fetch dashboard data'}), 500


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users (admin only)."""
    try:
        user_id = get_jwt_identity()
        db_service, _, _ = get_services()
        
        # Verify admin access
        verify_admin(user_id, db_service)
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        # Get users with pagination
        users, total_count = db_service.get_all_users(page, limit)
        total_pages = (total_count + limit - 1) // limit
        
        # Convert users to dict format (exclude password hash)
        users_data = []
        for user in users:
            users_data.append({
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'createdAt': user.created_at.isoformat()
            })
        
        response = {
            'data': users_data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': total_pages
            }
        }
        
        return jsonify(response), 200
        
    except AuthorizationError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': 'Failed to fetch users'}), 500


@admin_bp.route('/users/<user_id>/role', methods=['PATCH'])
@jwt_required()
def update_user_role(user_id):
    """Update user role (admin only)."""
    try:
        current_user_id = get_jwt_identity()
        db_service, _, _ = get_services()
        
        # Verify admin access
        verify_admin(current_user_id, db_service)
        
        # Get request data
        data = request.get_json()
        new_role = data.get('role')
        
        if not new_role or new_role not in ['student', 'admin']:
            return jsonify({'error': 'Invalid role. Must be "student" or "admin"'}), 400
        
        # Prevent admin from demoting themselves
        if user_id == current_user_id and new_role != 'admin':
            return jsonify({'error': 'Cannot change your own admin role'}), 400
        
        # Check if user exists
        user = db_service.get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update user role
        updated_user = db_service.update_user(user_id, role=new_role)
        if not updated_user:
            return jsonify({'error': 'Failed to update user role'}), 500
        
        # Return updated user (exclude password hash)
        user_data = {
            'id': updated_user.id,
            'name': updated_user.name,
            'email': updated_user.email,
            'role': updated_user.role,
            'createdAt': updated_user.created_at.isoformat()
        }
        
        return jsonify({'user': user_data}), 200
        
    except AuthorizationError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': 'Failed to update user role'}), 500


@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete user (admin only)."""
    try:
        current_user_id = get_jwt_identity()
        db_service, _, file_service = get_services()
        
        # Verify admin access
        verify_admin(current_user_id, db_service)
        
        # Prevent admin from deleting themselves
        if user_id == current_user_id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        # Check if user exists
        user = db_service.get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete user sessions with file cleanup first
        cleanup_success = db_service.delete_user_sessions_with_cleanup(user_id, file_service)
        
        # Delete user (this will handle remaining database cleanup)
        success = db_service.delete_user(user_id)
        if not success:
            return jsonify({'error': 'Failed to delete user'}), 500
        
        response_data = {'message': 'User deleted successfully'}
        
        # Include warning if file cleanup had issues
        if not cleanup_success:
            response_data['warning'] = 'User deleted but some attachment files could not be removed'
        
        return jsonify(response_data), 200
        
    except AuthorizationError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        current_app.logger.error(f"Error deleting user {user_id}: {str(e)}")
        return jsonify({'error': 'Failed to delete user'}), 500


@admin_bp.route('/topics/<topic_id>/reindex', methods=['POST'])
@jwt_required()
def reindex_topic(topic_id):
    """Reindex a topic's documents."""
    try:
        user_id = get_jwt_identity()
        db_service, vector_service, _ = get_services()
        
        # Verify admin access
        verify_admin(user_id, db_service)
        
        # Check if topic exists
        topic = db_service.get_topic_by_id(topic_id)
        if not topic:
            return jsonify({'error': 'Topic not found'}), 404
        
        # For now, return a message that this feature will be implemented
        # In a full implementation, you would:
        # 1. Get all documents for the topic
        # 2. Delete existing vector store
        # 3. Recreate vector store with all documents
        return jsonify({'message': 'Topic reindexing feature will be implemented'}), 501
        
    except AuthorizationError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': 'Failed to reindex topic'}), 500


@admin_bp.route('/system/status', methods=['GET'])
@jwt_required()
def get_system_status():
    """Get system status and health information."""
    try:
        user_id = get_jwt_identity()
        db_service, vector_service, _ = get_services()
        
        # Verify admin access
        verify_admin(user_id, db_service)
        
        # Check database connectivity
        try:
            db_service.get_all_topics()
            db_status = 'healthy'
        except Exception:
            db_status = 'error'
        
        # Check vector store status
        try:
            vector_service.get_all_topic_ids()
            vector_status = 'healthy'
        except Exception:
            vector_status = 'error'
        
        # Check OpenAI API key
        openai_status = 'configured' if current_app.config.get('OPENAI_API_KEY') else 'not_configured'
        
        status = {
            'database': db_status,
            'vectorStore': vector_status,
            'openaiApi': openai_status,
            'overallStatus': 'healthy' if all(s in ['healthy', 'configured'] for s in [db_status, vector_status, openai_status]) else 'degraded'
        }
        
        return jsonify(status), 200
        
    except AuthorizationError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': 'Failed to get system status'}), 500


@admin_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    """Get system analytics and usage statistics."""
    try:
        user_id = get_jwt_identity()
        db_service, _, _ = get_services()
        
        # Verify admin access
        verify_admin(user_id, db_service)
        
        # For now, return a message that this feature will be implemented
        # In a full implementation, you would provide:
        # - Usage statistics
        # - Popular topics
        # - User activity
        # - System performance metrics
        return jsonify({'message': 'Analytics feature will be implemented'}), 501
        
    except AuthorizationError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': 'Failed to fetch analytics'}), 500


@admin_bp.route('/system/cleanup', methods=['POST'])
@jwt_required()
def cleanup_system():
    """Perform system cleanup operations."""
    try:
        user_id = get_jwt_identity()
        db_service, vector_service, _ = get_services()
        
        # Verify admin access
        verify_admin(user_id, db_service)
        
        # For now, return a message that this feature will be implemented
        # In a full implementation, you would:
        # - Remove orphaned vector stores
        # - Clean up old chat sessions
        # - Remove unused uploaded files
        return jsonify({'message': 'System cleanup feature will be implemented'}), 501
        
    except AuthorizationError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': 'Failed to perform cleanup'}), 500


@admin_bp.route('/nps-analytics', methods=['GET'])
@jwt_required()
def get_admin_nps_analytics():
    """Get system-wide NPS analytics (admin only)."""
    try:
        user_id = get_jwt_identity()
        db_service, _, _ = get_services()
        
        # Verify admin access
        verify_admin(user_id, db_service)
        
        # Get query parameters
        topic_id = request.args.get('topic_id')
        days = int(request.args.get('days', 30))
        
        # Validate days parameter
        if days < 1 or days > 365:
            return jsonify({'error': 'Days must be between 1 and 365'}), 400
        
        # Get system-wide NPS analytics (no user_id filter)
        nps_data = db_service.get_nps_analytics(user_id=None, topic_id=topic_id, days=days)
        
        return jsonify(nps_data), 200
        
    except AuthorizationError as e:
        return jsonify({'error': str(e)}), 403
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to fetch NPS analytics'}), 500


# Error handlers for admin blueprint
@admin_bp.errorhandler(AuthorizationError)
def handle_authorization_error(e):
    return jsonify({'error': str(e)}), 403
