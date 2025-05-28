"""
Topics management routes.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.services.database import DatabaseService
from app.services.document_loader import DocumentLoader
from app.services.vector_store import VectorStoreService
from app.utils.exceptions import ValidationError, AuthorizationError

topics_bp = Blueprint('topics', __name__)


def get_services():
    """Get service instances."""
    db_service = DatabaseService()
    doc_loader = DocumentLoader(
        chunk_size=current_app.config.get('CHUNK_SIZE', 1000),
        chunk_overlap=current_app.config.get('CHUNK_OVERLAP', 200)
    )
    vector_service = VectorStoreService(current_app.config['CHROMA_PERSIST_DIR'])
    return db_service, doc_loader, vector_service


@topics_bp.route('', methods=['GET'])
@jwt_required()
def get_topics():
    """Get all topics."""
    try:
        db_service, _, _ = get_services()
        topics = db_service.get_all_topics()
        
        return jsonify([topic.to_dict() for topic in topics]), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch topics'}), 500


@topics_bp.route('', methods=['POST'])
@jwt_required()
def create_topic():
    """Create a new topic (admin only)."""
    try:
        user_id = get_jwt_identity()
        db_service, _, _ = get_services()
        
        # Check if user is admin
        user = db_service.get_user_by_id(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        # Validate input
        if not all(k in data for k in ('name', 'description')):
            return jsonify({'error': 'Missing required fields: name, description'}), 400
        
        if not data['name'].strip():
            return jsonify({'error': 'Topic name cannot be empty'}), 400
        
        # Check for duplicate topic names
        existing_topics = db_service.get_all_topics()
        if any(topic.name.lower() == data['name'].strip().lower() for topic in existing_topics):
            return jsonify({'error': 'Topic with this name already exists'}), 400
        
        # Create topic
        topic = db_service.create_topic(
            name=data['name'].strip(),
            description=data['description'].strip(),
            created_by=user_id
        )
        
        return jsonify({
            'topic': topic.to_dict(),
            'message': 'Topic created successfully'
        }), 201
        
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except AuthorizationError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': 'Failed to create topic'}), 500


@topics_bp.route('/<topic_id>', methods=['GET'])
@jwt_required()
def get_topic(topic_id):
    """Get a specific topic by ID."""
    try:
        db_service, _, vector_service = get_services()
        
        topic = db_service.get_topic_by_id(topic_id)
        
        if not topic:
            return jsonify({'error': 'Topic not found'}), 404
        
        # Add additional information
        topic_dict = topic.to_dict()
        topic_dict['hasDocuments'] = vector_service.topic_index_exists(topic_id)
        topic_dict['documentCount'] = vector_service.get_topic_document_count(topic_id)
        
        return jsonify(topic_dict), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch topic'}), 500


@topics_bp.route('/<topic_id>/documents', methods=['POST'])
@jwt_required()
def upload_document(topic_id):
    """Upload a document to a topic (admin only)."""
    try:
        user_id = get_jwt_identity()
        db_service, doc_loader, vector_service = get_services()
        
        # Check if user is admin
        user = db_service.get_user_by_id(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Check if topic exists
        topic = db_service.get_topic_by_id(topic_id)
        if not topic:
            return jsonify({'error': 'Topic not found'}), 404
        
        # Validate file upload
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if not doc_loader.validate_pdf_file(file):
            return jsonify({'error': 'Invalid PDF file'}), 400
        
        # Save uploaded file
        file_path = doc_loader.save_uploaded_file(
            file, 
            current_app.config['UPLOAD_FOLDER'], 
            topic_id
        )
        
        # Process document
        chunks = doc_loader.load_and_split_pdf(file_path)
        
        if not chunks:
            return jsonify({'error': 'No content could be extracted from the PDF'}), 400
        
        # Create or update vector index
        if vector_service.topic_index_exists(topic_id):
            vector_service.update_topic_index(topic_id, chunks)
        else:
            vector_service.create_topic_index(topic_id, chunks)
        
        # Update topic document count
        db_service.increment_topic_document_count(topic_id)
        
        return jsonify({
            'message': 'Document uploaded and processed successfully',
            'documentPath': file_path,
            'chunksCreated': len(chunks)
        }), 200
        
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except AuthorizationError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': f'Failed to upload document: {str(e)}'}), 500


@topics_bp.route('/<topic_id>', methods=['PUT'])
@jwt_required()
def update_topic(topic_id):
    """Update a topic (admin only)."""
    try:
        user_id = get_jwt_identity()
        db_service, _, _ = get_services()
        
        # Check if user is admin
        user = db_service.get_user_by_id(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Check if topic exists
        topic = db_service.get_topic_by_id(topic_id)
        if not topic:
            return jsonify({'error': 'Topic not found'}), 404
        
        data = request.get_json()
        
        # For now, we'll return a message that this feature will be implemented
        # In a full implementation, you would update the topic in the database
        return jsonify({'message': 'Topic update feature will be implemented'}), 501
        
    except Exception as e:
        return jsonify({'error': 'Failed to update topic'}), 500


@topics_bp.route('/<topic_id>', methods=['DELETE'])
@jwt_required()
def delete_topic(topic_id):
    """Delete a topic and its associated data (admin only)."""
    try:
        user_id = get_jwt_identity()
        db_service, _, vector_service = get_services()
        
        # Check if user is admin
        user = db_service.get_user_by_id(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Check if topic exists
        topic = db_service.get_topic_by_id(topic_id)
        if not topic:
            return jsonify({'error': 'Topic not found'}), 404
        
        # Delete vector store
        vector_service.delete_topic_index(topic_id)
        
        # For now, we'll return a message that full deletion will be implemented
        # In a full implementation, you would also delete the topic from the database
        # and clean up associated chat sessions and messages
        return jsonify({'message': 'Topic deletion feature will be implemented'}), 501
        
    except Exception as e:
        return jsonify({'error': 'Failed to delete topic'}), 500


@topics_bp.route('/<topic_id>/search', methods=['POST'])
@jwt_required()
def search_topic_documents(topic_id):
    """Search documents within a topic."""
    try:
        db_service, _, vector_service = get_services()
        
        # Check if topic exists
        topic = db_service.get_topic_by_id(topic_id)
        if not topic:
            return jsonify({'error': 'Topic not found'}), 404
        
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({'error': 'Search query is required'}), 400
        
        query = data['query'].strip()
        if not query:
            return jsonify({'error': 'Search query cannot be empty'}), 400
        
        # Get number of results (default 4)
        k = data.get('k', 4)
        if k > 10:  # Limit maximum results
            k = 10
        
        # Search documents
        results = vector_service.search_topic_documents(topic_id, query, k)
        
        # Format results
        formatted_results = []
        for i, doc in enumerate(results):
            formatted_results.append({
                'id': i,
                'content': doc.page_content,
                'metadata': doc.metadata,
                'score': getattr(doc, 'score', None)  # If available
            })
        
        return jsonify({
            'query': query,
            'results': formatted_results,
            'totalResults': len(formatted_results)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Search failed: {str(e)}'}), 500


# Error handlers for topics blueprint
@topics_bp.errorhandler(ValidationError)
def handle_validation_error(e):
    return jsonify({'error': str(e)}), 400


@topics_bp.errorhandler(AuthorizationError)
def handle_authorization_error(e):
    return jsonify({'error': str(e)}), 403
