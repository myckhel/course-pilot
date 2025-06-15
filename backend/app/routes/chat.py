"""
Chat and messaging routes.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.database import DatabaseService
from app.services.vector_store import VectorStoreService
from app.services.qa_chain import QAChainService
from app.services.attachment_processor import AttachmentProcessor
from app.utils.exceptions import ValidationError
from app.utils.file_upload import FileUploadService

chat_bp = Blueprint('chat', __name__)


def get_services():
    """Get service instances."""
    db_service = DatabaseService()
    vector_service = VectorStoreService(current_app.config['CHROMA_PERSIST_DIR'])
    qa_service = QAChainService(
        model_name=current_app.config.get('MODEL_NAME', 'gpt-3.5-turbo'),
        temperature=current_app.config.get('MODEL_TEMPERATURE', 0.0)
    )
    file_service = FileUploadService(current_app.config.get('UPLOAD_DIR', 'uploads/attachments'))
    attachment_processor = AttachmentProcessor()
    return db_service, vector_service, qa_service, file_service, attachment_processor


@chat_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_chat_sessions():
    """Get chat sessions for the current user."""
    try:
        user_id = get_jwt_identity()
        topic_id = request.args.get('topicId')
        db_service, _, _, _, _ = get_services()
        
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
        
        db_service, vector_service, _, _, _ = get_services()
        
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
        db_service, _, _, _, _ = get_services()
        
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
        print(e)
        return jsonify({'error': 'Failed to fetch chat session'}), 500


@chat_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    """Send a message and get AI response."""
    try:
        user_id = get_jwt_identity()
        
        # Handle both form data (with file) and JSON data
        if request.content_type and 'multipart/form-data' in request.content_type:
            # Handle form data with potential file attachment
            session_id = request.form.get('sessionId')
            message_text = request.form.get('message')
            attachment_file = request.files.get('attachment')
        else:
            # Handle JSON data (backward compatibility)
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            session_id = data.get('sessionId')
            message_text = data.get('message')
            attachment_file = None
        
        # Validate input
        if not session_id or not message_text:
            return jsonify({'error': 'Missing required fields: sessionId, message'}), 400
        
        db_service, vector_service, qa_service, file_service, attachment_processor = get_services()
        
        # Get and validate session
        session = db_service.get_chat_session_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Chat session not found'}), 404
        
        if session.user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Validate message
        message_text = message_text.strip()
        if not qa_service.validate_question(message_text):
            return jsonify({'error': 'Invalid question format'}), 400
        
        # Handle file attachment if provided
        attachment_filename = None
        attachment_path = None
        attachment_size = None
        
        if attachment_file:
            try:
                attachment_filename, attachment_path, attachment_size = file_service.save_file(
                    attachment_file, session_id
                )
            except ValueError as e:
                return jsonify({'error': f'File upload error: {str(e)}'}), 400
        
        # Save user message with attachment info
        user_message = db_service.save_message(
            session_id=session.id,
            sender='user',
            message=message_text,
            attachment_filename=attachment_filename,
            attachment_path=attachment_path,
            attachment_size=attachment_size
        )
        
        try:
            # Get retriever for the topic
            retriever = vector_service.get_topic_retriever(session.topic_id)
            
            # Process attachment content if available
            attachment_content = None
            has_attachment = attachment_path is not None
            
            if has_attachment:
                try:
                    # Extract content from attachment
                    content_data = attachment_processor.extract_content(attachment_path, attachment_filename)
                    
                    if content_data and content_data.get('content'):
                        # Create enhanced context with attachment
                        attachment_content = attachment_processor.create_attachment_context(
                            content_data, message_text
                        )
                except Exception as attachment_error:
                    # Log attachment processing error but continue with regular processing
                    print(f"Attachment processing error: {attachment_error}")
                    has_attachment = False
            
            # Create QA chain (with or without attachment support)
            qa_chain = qa_service.create_qa_chain_with_attachment(
                retriever, 
                attachment_context=has_attachment
            )
            
            # Get conversation context (optional enhancement)
            previous_messages = db_service.get_session_messages(session.id)
            previous_message_dicts = [msg.to_dict() for msg in previous_messages[-6:]]  # Last 3 exchanges
            
            # Generate AI response with attachment context if available
            if has_attachment and attachment_content:
                result = qa_service.ask_question_with_attachment(
                    qa_chain, message_text, attachment_content
                )
            else:
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
        print(e)
        return jsonify({'error': 'Failed to process message'}), 500


@chat_bp.route('/sessions/<session_id>/messages', methods=['GET'])
@jwt_required()
def get_session_messages(session_id):
    """Get all messages for a chat session."""
    try:
        user_id = get_jwt_identity()
        db_service, _, _, _, _ = get_services()
        
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
        print(e)
        return jsonify({'error': 'Failed to fetch messages'}), 500


@chat_bp.route('/sessions/<session_id>', methods=['DELETE'])
@jwt_required()
def delete_chat_session(session_id):
    """Delete a chat session and all its associated resources."""
    try:
        user_id = get_jwt_identity()
        db_service, _, _, file_service, _ = get_services()
        
        # Verify session exists and user has access
        session = db_service.get_chat_session_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Chat session not found'}), 404
        
        if session.user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get all attachment file paths before deleting database records
        attachment_paths = db_service.get_session_attachment_paths(session_id)
        
        # Delete session and messages from database
        if db_service.delete_chat_session(session_id):
            # Clean up file attachments
            cleanup_success = True
            
            # Delete individual attachment files
            for file_path in attachment_paths:
                if not file_service.delete_file(file_path):
                    cleanup_success = False
                    current_app.logger.warning(f"Failed to delete attachment file: {file_path}")
            
            # Clean up session directory (this will remove any remaining files and the directory)
            if not file_service.cleanup_session_files(session_id):
                cleanup_success = False
                current_app.logger.warning(f"Failed to cleanup session directory: {session_id}")
            
            response_data = {
                'message': 'Chat session deleted successfully',
                'sessionId': session_id
            }
            
            # Include warning if file cleanup had issues
            if not cleanup_success:
                response_data['warning'] = 'Session deleted but some attachment files could not be removed'
            
            return jsonify(response_data), 200
        else:
            return jsonify({'error': 'Failed to delete session from database'}), 500
        
    except Exception as e:
        current_app.logger.error(f"Error deleting session {session_id}: {str(e)}")
        return jsonify({'error': 'Failed to delete session'}), 500


@chat_bp.route('/messages/<message_id>/rating', methods=['PATCH'])
@jwt_required()
def update_message_rating(message_id):
    """Update the rating of a message."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate input
        if 'rating' not in data:
            return jsonify({'error': 'Missing required field: rating'}), 400
        
        rating = data['rating']
        if rating not in ['positive', 'negative', None]:
            return jsonify({'error': 'Invalid rating value. Must be "positive", "negative", or null'}), 400
        
        db_service, _, _, _, _ = get_services()
        
        # Get the message and verify ownership
        message = db_service.get_message_by_id(message_id)
        if not message:
            return jsonify({'error': 'Message not found'}), 404
        
        # Get the session to verify user ownership
        session = db_service.get_chat_session_by_id(message.session_id)
        if not session or session.user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Only allow rating assistant messages
        if message.sender != 'assistant':
            return jsonify({'error': 'Can only rate AI assistant messages'}), 400
        
        # Update the rating
        updated_message = db_service.update_message_rating(message_id, rating)
        
        if updated_message:
            return jsonify({
                'message': updated_message.to_dict(),
                'success': True
            }), 200
        else:
            return jsonify({'error': 'Failed to update rating'}), 500
        
    except Exception as e:
        return jsonify({'error': 'Failed to update message rating'}), 500


@chat_bp.route('/sessions/<session_id>', methods=['PUT'])
@jwt_required()
def update_chat_session(session_id):
    """Update a chat session (e.g., title)."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        db_service, _, _, _, _ = get_services()
        
        # Get session
        session = db_service.get_chat_session_by_id(session_id)
        
        if not session:
            return jsonify({'error': 'Chat session not found'}), 404
        
        # Verify user owns the session
        if session.user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Update title if provided
        if 'title' in data:
            title = data['title'].strip()
            if not title:
                return jsonify({'error': 'Title cannot be empty'}), 400
            
            # Update session title
            updated_session = db_service.update_chat_session_title(session_id, title)
            
            if updated_session:
                return jsonify(updated_session.to_dict()), 200
            else:
                return jsonify({'error': 'Failed to update session'}), 500
        
        return jsonify({'error': 'No valid fields to update'}), 400
        
    except Exception as e:
        print(f"Error updating session: {e}")
        return jsonify({'error': 'Failed to update chat session'}), 500


# Error handlers for chat blueprint
@chat_bp.errorhandler(ValidationError)
def handle_validation_error(e):
    return jsonify({'error': str(e)}), 400
