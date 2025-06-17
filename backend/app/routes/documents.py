"""
Document management routes.
"""
import os
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.services.database import DatabaseService
from app.services.document_loader import DocumentLoader
from app.services.vector_store import VectorStoreService
from app.services.document_service import DocumentService
from app.utils.exceptions import ValidationError, AuthorizationError
from app.models import Document
from app.extensions import db

documents_bp = Blueprint('documents', __name__)


def get_services():
    """Get service instances."""
    db_service = DatabaseService()
    doc_loader = DocumentLoader(
        chunk_size=current_app.config.get('CHUNK_SIZE', 1000),
        chunk_overlap=current_app.config.get('CHUNK_OVERLAP', 200)
    )
    vector_service = VectorStoreService(current_app.config['CHROMA_PERSIST_DIR'])
    doc_service = DocumentService(db_service)
    return db_service, doc_loader, vector_service, doc_service


@documents_bp.route('/topics/<topic_id>', methods=['POST'])
@jwt_required()
def upload_document(topic_id):
    """Upload a document to a topic (admin only)."""
    try:
        user_id = get_jwt_identity()
        db_service, doc_loader, vector_service, doc_service = get_services()
        
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
        
        # Use document service for deduplication and processing
        result = doc_service.process_document_upload(
            file=file,
            topic_id=topic_id,
            user_id=user_id,
            upload_folder=current_app.config['UPLOAD_FOLDER']
        )
        
        if result['is_duplicate']:
            return jsonify({
                'message': 'Document already exists',
                'duplicate': True,
                'existing_document': result['existing_document']
            }), 200
        
        # Update topic document count
        db_service.increment_topic_document_count(topic_id)
        
        return jsonify({
            'message': 'Document uploaded and processed successfully',
            'duplicate': False,
            'document': result['document_record'],
            'chunksCreated': result['chunks_created']
        }), 200
        
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except AuthorizationError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': f'Failed to upload document: {str(e)}'}), 500


@documents_bp.route('/topics/<topic_id>', methods=['GET'])
@jwt_required()
def get_topic_documents(topic_id):
    """Get all documents for a topic."""
    try:
        user_id = get_jwt_identity()
        db_service, _, _, _ = get_services()
        
        # Check if topic exists
        topic = db_service.get_topic_by_id(topic_id)
        if not topic:
            return jsonify({'error': 'Topic not found'}), 404
        
        # Get documents from database
        documents = Document.query.filter_by(topic_id=topic_id).all()
        
        return jsonify([doc.to_dict() for doc in documents]), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch documents: {str(e)}'}), 500


@documents_bp.route('/topics/<topic_id>/search', methods=['POST'])
@jwt_required()
def search_topic_documents(topic_id):
    """Search documents within a topic."""
    try:
        user_id = get_jwt_identity()
        db_service, _, vector_service, _ = get_services()
        
        # Check if topic exists
        topic = db_service.get_topic_by_id(topic_id)
        if not topic:
            return jsonify({'error': 'Topic not found'}), 404
        
        # Get search parameters
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'Search query is required'}), 400
        
        query = data['query']
        k = data.get('k', 10)  # Number of results to return
        
        if not query.strip():
            return jsonify({'error': 'Search query cannot be empty'}), 400
        
        # Check if topic has documents indexed
        if not vector_service.topic_index_exists(topic_id):
            return jsonify({
                'query': query,
                'results': [],
                'totalResults': 0,
                'message': 'No documents indexed for this topic'
            }), 200
        
        # Search documents
        results = vector_service.search_topic_documents(topic_id, query, k)
        
        # Format results
        formatted_results = []
        for doc in results:
            formatted_results.append({
                'content': doc.page_content if hasattr(doc, 'page_content') else str(doc),
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


@documents_bp.route('/<document_id>', methods=['DELETE'])
@jwt_required()
def delete_document(document_id):
    """Delete a document (admin only)."""
    try:
        user_id = get_jwt_identity()
        db_service, _, vector_service, _ = get_services()
        
        # Check if user is admin
        user = db_service.get_user_by_id(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get document
        document = Document.query.filter_by(id=document_id).first()
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        # Remove from vector store if processed
        if document.is_processed:
            try:
                vector_service.remove_document_from_topic(document.topic_id, document_id)
            except Exception as e:
                current_app.logger.warning(f"Failed to remove document from vector store: {e}")
        
        # Remove file from filesystem
        if os.path.exists(document.file_path):
            try:
                os.remove(document.file_path)
            except Exception as e:
                current_app.logger.warning(f"Failed to remove file: {e}")
        
        # Delete from database
        db.session.delete(document)
        db.session.commit()
        
        # Update topic document count
        topic = db_service.get_topic_by_id(document.topic_id)
        if topic and topic.document_count > 0:
            topic.document_count -= 1
            db.session.commit()
        
        return jsonify({'message': 'Document deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete document: {str(e)}'}), 500


@documents_bp.route('/<document_id>/download', methods=['GET'])
@jwt_required()
def download_document(document_id):
    """Download a document."""
    try:
        user_id = get_jwt_identity()
        db_service, _, _, _ = get_services()
        
        # Get document
        document = Document.query.filter_by(id=document_id).first()
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        # Check if file exists
        if not os.path.exists(document.file_path):
            return jsonify({'error': 'File not found on disk'}), 404
        
        # Send file
        return send_file(
            document.file_path,
            as_attachment=True,
            download_name=document.original_filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': f'Failed to download document: {str(e)}'}), 500


@documents_bp.route('/<document_id>', methods=['GET'])
@jwt_required()
def get_document_details(document_id):
    """Get detailed information about a specific document."""
    try:
        user_id = get_jwt_identity()
        db_service, _, _, _ = get_services()
        
        # Get document
        document = Document.query.filter_by(id=document_id).first()
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        return jsonify(document.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch document details: {str(e)}'}), 500


@documents_bp.route('/<document_id>/reprocess', methods=['POST'])
@jwt_required()
def reprocess_document(document_id):
    """Reprocess a document (admin only)."""
    try:
        user_id = get_jwt_identity()
        db_service, doc_loader, vector_service, doc_service = get_services()
        
        # Check if user is admin
        user = db_service.get_user_by_id(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get document
        document = Document.query.filter_by(id=document_id).first()
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        # Check if file exists
        if not os.path.exists(document.file_path):
            return jsonify({'error': 'File not found on disk'}), 404
        
        # Reprocess the document
        result = doc_service.reprocess_document(document_id)
        
        return jsonify({
            'message': 'Document reprocessed successfully',
            'document': result['document_record'],
            'chunksCreated': result['chunks_created']
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to reprocess document: {str(e)}'}), 500


# Error handlers for documents blueprint
@documents_bp.errorhandler(ValidationError)
def handle_validation_error(e):
    return jsonify({'error': str(e)}), 400


@documents_bp.errorhandler(AuthorizationError)
def handle_authorization_error(e):
    return jsonify({'error': str(e)}), 403
