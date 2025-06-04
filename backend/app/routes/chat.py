"""
Chat and messaging routes.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.database import DatabaseService
from app.services.vector_store import VectorStoreService
from app.services.qa_chain import QAChainService
from app.utils.exceptions import ValidationError

chat_bp = Blueprint('chat', __name__)


def get_services():
    """Get service instances."""
    db_service = DatabaseService()
    vector_service = VectorStoreService(current_app.config['CHROMA_PERSIST_DIR'])
    qa_service = QAChainService(
        model_name=current_app.config.get('MODEL_NAME', 'gpt-3.5-turbo'),
        temperature=current_app.config.get('MODEL_TEMPERATURE', 0.0)
    )
    return db_service, vector_service, qa_service


@chat_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_chat_sessions():
    """Get chat sessions for the current user."""
    try:
        user_id = get_jwt_identity()
        topic_id = request.args.get('topicId')
        db_service, _, _ = get_services()
        
        if not topic_id:
            # If no topic ID provided, get the default topic
            default_topic = db_service.get_default_topic()
            if default_topic:
                topic_id = default_topic.id
        
        # Get chat sessions (will get all sessions if topic_id is None)
        sessions = db_service.get_chat_sessions(user_id, topic_id)
        
        return jsonify([session.to_dict() for session in sessions]), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch chat sessions'}), 500


@chat_bp.route('/sessions', methods=['POST'])
@jwt_required()
def create_chat_session():
    """Create a new chat session."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate input - topicId is now optional, title is still required
        if 'title' not in data:
            return jsonify({'error': 'Missing required field: title'}), 400
        
        db_service, vector_service, _ = get_services()
        
        # If no topic ID is provided, use the default GST topic
        if 'topicId' not in data:
            topic = db_service.get_default_topic()
            if not topic:
                return jsonify({'error': 'Default GST topic not found'}), 500
        else:
            # Verify specific topic exists
            topic = db_service.get_topic_by_id(data['topicId'])
            if not topic:
                return jsonify({'error': 'Topic not found'}), 404
        
        # Verify topic has documents
        if not vector_service.topic_index_exists(topic.id):
            return jsonify({'error': 'Topic has no documents available for Q&A'}), 400
        
        # Create chat session
        session = db_service.create_chat_session(
            user_id=user_id,
            topic_id=topic.id,
            title=data['title'].strip()
        )
        
        return jsonify({
            'session': session.to_dict(),
            'message': 'Chat session created successfully'
        }), 201
        
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to create chat session'}), 500


@chat_bp.route('/sessions/<session_id>', methods=['GET'])
@jwt_required()
def get_chat_session(session_id):
    """Get a specific chat session with its messages."""
    try:
        user_id = get_jwt_identity()
        db_service, _, _ = get_services()
        
        # Get session
        session = db_service.get_chat_session_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Chat session not found'}), 404
        
        # Verify user owns the session
        if session.user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get messages for the session
        messages = db_service.get_session_messages(session_id)
        
        return jsonify({
            'session': session.to_dict(),
            'messages': [message.to_dict() for message in messages]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch chat session'}), 500


@chat_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    """Send a message and get AI response."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate input
        if not all(k in data for k in ('sessionId', 'message')):
            return jsonify({'error': 'Missing required fields: sessionId, message'}), 400
        
        db_service, vector_service, qa_service = get_services()
        
        # Get and validate session
        session = db_service.get_chat_session_by_id(data['sessionId'])
        
        if not session:
            return jsonify({'error': 'Chat session not found'}), 404
        
        if session.user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Validate message
        message_text = data['message'].strip()
        if not qa_service.validate_question(message_text):
            return jsonify({'error': 'Invalid question format'}), 400
        
        # Save user message
        user_message = db_service.save_message(
            session_id=session.id,
            sender='user',
            message=message_text
        )
        
        try:
            # Get retriever for the topic
            retriever = vector_service.get_topic_retriever(session.topic_id)
            
            # Create QA chain
            qa_chain = qa_service.create_qa_chain(retriever)
            
            # Get conversation context (optional enhancement)
            previous_messages = db_service.get_session_messages(session.id)
            previous_message_dicts = [msg.to_dict() for msg in previous_messages[-6:]]  # Last 3 exchanges
            
            # Generate AI response
            result = qa_service.ask_question(qa_chain, message_text)
            
            # Save AI response
            ai_message = db_service.save_message(
                session_id=session.id,
                sender='assistant',
                message=result['answer'],
                sources=result.get('sources', [])
            )
            
            return jsonify({
                'userMessage': user_message.to_dict(),
                'aiMessage': ai_message.to_dict(),
                'success': True
            }), 200
            
        except Exception as ai_error:
            # If AI processing fails, still save the user message but return error
            error_message = db_service.save_message(
                session_id=session.id,
                sender='assistant',
                message="I'm sorry, I encountered an error while processing your question. Please try again.",
                sources=[]
            )
            
            return jsonify({
                'userMessage': user_message.to_dict(),
                'aiMessage': error_message.to_dict(),
                'error': 'Failed to generate AI response',
                'success': False
            }), 200
        
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to process message'}), 500


@chat_bp.route('/sessions/<session_id>/messages', methods=['GET'])
@jwt_required()
def get_session_messages(session_id):
    """Get all messages for a chat session."""
    try:
        user_id = get_jwt_identity()
        db_service, _, _ = get_services()
        
        # Verify session exists and user has access
        session = db_service.get_chat_session_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Chat session not found'}), 404
        
        if session.user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get messages
        messages = db_service.get_session_messages(session_id)
        
        return jsonify([message.to_dict() for message in messages]), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch messages'}), 500


@chat_bp.route('/sessions/<session_id>', methods=['DELETE'])
@jwt_required()
def delete_chat_session(session_id):
    """Delete a chat session (for future implementation)."""
    try:
        user_id = get_jwt_identity()
        db_service, _, _ = get_services()
        
        # Verify session exists and user has access
        session = db_service.get_chat_session_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Chat session not found'}), 404
        
        if session.user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # For now, return a message that this feature will be implemented
        # In a full implementation, you would delete the session and its messages
        return jsonify({'message': 'Session deletion feature will be implemented'}), 501
        
    except Exception as e:
        return jsonify({'error': 'Failed to delete session'}), 500


# Error handlers for chat blueprint
@chat_bp.errorhandler(ValidationError)
def handle_validation_error(e):
    return jsonify({'error': str(e)}), 400
