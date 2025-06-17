"""
Document service for handling file uploads and deduplication.
"""
import hashlib
import os
import uuid
from pathlib import Path
from typing import List, Optional, Tuple
from werkzeug.utils import secure_filename
from app.models import Document
from app.extensions import db
from app.services.document_loader import DocumentLoader
from langchain_core.documents import Document as LangchainDocument


class DocumentService:
    """Service for managing document uploads and preventing duplicates."""
    
    def __init__(self, db_service=None):
        self.doc_loader = DocumentLoader(chunk_size=500, chunk_overlap=50)
        self.db_service = db_service
    
    def calculate_file_hash(self, file_path: str) -> str:
        """Calculate SHA-256 hash of a file."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def calculate_content_hash(self, content: str) -> str:
        """Calculate SHA-256 hash of text content."""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    def extract_and_hash_content(self, file_path: str) -> Tuple[str, List[LangchainDocument]]:
        """Extract content from PDF and calculate its hash."""
        try:
            # Load and split document
            chunks = self.doc_loader.load_and_split_pdf(file_path)
            
            # Combine all chunk content
            combined_content = "\n".join([chunk.page_content for chunk in chunks])
            
            # Calculate content hash
            content_hash = self.calculate_content_hash(combined_content)
            
            return content_hash, chunks
        except Exception as e:
            raise Exception(f"Failed to extract content: {str(e)}")
    
    def check_duplicate_by_file_hash(self, file_hash: str, topic_id: Optional[str] = None) -> Optional[Document]:
        """Check if a document with the same file hash already exists."""
        query = Document.query.filter_by(file_hash=file_hash)
        if topic_id:
            query = query.filter_by(topic_id=topic_id)
        return query.first()
    
    def check_duplicate_by_content_hash(self, content_hash: str, topic_id: Optional[str] = None) -> Optional[Document]:
        """Check if a document with the same content hash already exists."""
        query = Document.query.filter_by(content_hash=content_hash)
        if topic_id:
            query = query.filter_by(topic_id=topic_id)
        return query.first()
    
    def check_duplicate_by_filename(self, filename: str, topic_id: str) -> Optional[Document]:
        """Check if a document with the same filename already exists in the topic."""
        return Document.query.filter_by(
            original_filename=filename,
            topic_id=topic_id
        ).first()
    
    def is_document_already_processed(self, file_path: str, topic_id: str) -> Tuple[bool, Optional[Document]]:
        """
        Check if a document is already processed using multiple strategies.
        
        Returns:
            Tuple of (is_duplicate, existing_document)
        """
        try:
            # Calculate file hash
            file_hash = self.calculate_file_hash(file_path)
            
            # Check by file hash first (fastest)
            existing_doc = self.check_duplicate_by_file_hash(file_hash, topic_id)
            if existing_doc and existing_doc.is_processed:
                return True, existing_doc
            
            # Check by content hash (more thorough)
            content_hash, _ = self.extract_and_hash_content(file_path)
            existing_doc = self.check_duplicate_by_content_hash(content_hash, topic_id)
            if existing_doc and existing_doc.is_processed:
                return True, existing_doc
            
            return False, None
            
        except Exception as e:
            # If we can't check, assume it's not a duplicate to be safe
            print(f"Warning: Could not check for duplicates: {str(e)}")
            return False, None
    
    def create_document_record(
        self,
        topic_id: str,
        file_path: str,
        original_filename: str,
        uploaded_by: str,
        chunks: List[LangchainDocument]
    ) -> Document:
        """Create a document record in the database."""
        try:
            # Calculate hashes
            file_hash = self.calculate_file_hash(file_path)
            combined_content = "\n".join([chunk.page_content for chunk in chunks])
            content_hash = self.calculate_content_hash(combined_content)
            
            # Get file size
            file_size = os.path.getsize(file_path)
            
            # Generate filename for storage
            file_extension = Path(file_path).suffix
            filename = f"{uuid.uuid4()}{file_extension}"
            
            # Create document record
            document = Document(
                id=str(uuid.uuid4()),
                topic_id=topic_id,
                filename=filename,
                original_filename=original_filename,
                file_path=file_path,
                file_hash=file_hash,
                file_size=file_size,
                content_hash=content_hash,
                chunk_count=len(chunks),
                is_processed=True,
                uploaded_by=uploaded_by
            )
            
            db.session.add(document)
            db.session.commit()
            
            return document
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Failed to create document record: {str(e)}")
    
    def get_topic_documents(self, topic_id: str, include_unprocessed: bool = False) -> List[Document]:
        """Get all documents for a topic."""
        query = Document.query.filter_by(topic_id=topic_id)
        if not include_unprocessed:
            query = query.filter_by(is_processed=True)
        return query.all()
    
    def delete_document(self, document_id: str) -> bool:
        """Delete a document record and its file."""
        try:
            document = Document.query.get(document_id)
            if not document:
                return False
            
            # Delete file if it exists
            if os.path.exists(document.file_path):
                os.remove(document.file_path)
            
            # Delete database record
            db.session.delete(document)
            db.session.commit()
            
            return True
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Failed to delete document: {str(e)}")
    
    def mark_document_processed(self, document_id: str, chunk_count: int) -> bool:
        """Mark a document as processed with chunk count."""
        try:
            document = Document.query.get(document_id)
            if not document:
                return False
            
            document.is_processed = True
            document.chunk_count = chunk_count
            db.session.commit()
            
            return True
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Failed to mark document as processed: {str(e)}")
    
    def get_document_by_hash(self, file_hash: str) -> Optional[Document]:
        """Get document by file hash."""
        return Document.query.filter_by(file_hash=file_hash).first()
    
    def get_total_documents_count(self) -> int:
        """Get total number of processed documents."""
        return Document.query.filter_by(is_processed=True).count()
    
    def get_topic_documents_count(self, topic_id: str) -> int:
        """Get count of processed documents for a topic."""
        return Document.query.filter_by(topic_id=topic_id, is_processed=True).count()
    
    def process_document_upload(self, file, topic_id: str, user_id: str, upload_folder: str) -> dict:
        """
        Process a complete document upload with deduplication.
        
        Args:
            file: Uploaded file object
            topic_id: Topic ID to associate with
            user_id: User ID of uploader
            upload_folder: Directory to save uploaded files
            
        Returns:
            dict: {
                'is_duplicate': bool,
                'document_record': dict or None,
                'existing_document': dict or None,
                'chunks_created': int,
                'file_path': str
            }
        """
        try:
            # Generate unique filename
            original_filename = secure_filename(file.filename)
            name, ext = os.path.splitext(original_filename)
            filename = f"{name}_{uuid.uuid4()}{ext}"
            temp_file_path = os.path.join(upload_folder, filename)
            
            # Ensure upload directory exists
            os.makedirs(upload_folder, exist_ok=True)
            
            # Save file
            file.save(temp_file_path)
            
            # Calculate file hash
            file_hash = self.calculate_file_hash(temp_file_path)
            
            # Check for duplicate by file hash
            existing_doc = self.check_duplicate_by_file_hash(file_hash, topic_id)
            if existing_doc:
                # Remove temp file since it's a duplicate
                os.remove(temp_file_path)
                return {
                    'is_duplicate': True,
                    'document_record': None,
                    'existing_document': existing_doc.to_dict(),
                    'chunks_created': existing_doc.chunk_count or 0,
                    'file_path': existing_doc.file_path
                }
            
            # Extract content and calculate content hash
            content_hash, chunks = self.extract_and_hash_content(temp_file_path)
            
            # Check for duplicate by content hash
            existing_content_doc = self.check_duplicate_by_content_hash(content_hash, topic_id)
            if existing_content_doc:
                # Remove temp file since content is duplicate
                os.remove(temp_file_path)
                return {
                    'is_duplicate': True,
                    'document_record': None,
                    'existing_document': existing_content_doc.to_dict(),
                    'chunks_created': existing_content_doc.chunk_count or 0,
                    'file_path': existing_content_doc.file_path
                }
            
            # Create final file path
            final_filename = f"{topic_id}_{filename}"
            final_file_path = os.path.join(upload_folder, final_filename)
            
            # Move file to final location
            os.rename(temp_file_path, final_file_path)
            
            # Create document record
            document_record = self.create_document_record(
                filename=file.filename,
                file_path=final_file_path,
                file_hash=file_hash,
                content_hash=content_hash,
                topic_id=topic_id,
                uploader_id=user_id,
                file_size=os.path.getsize(final_file_path)
            )
            
            # Add to vector store
            from app.services.vector_store import VectorStoreService
            from app.config import Config
            
            vector_service = VectorStoreService(Config.CHROMA_PERSIST_DIR)
            
            if vector_service.topic_index_exists(topic_id):
                vector_service.update_topic_index(topic_id, chunks)
            else:
                vector_service.create_topic_index(topic_id, chunks)
            
            # Mark as processed
            self.mark_document_processed(document_record.id, len(chunks))
            
            return {
                'is_duplicate': False,
                'document_record': document_record.to_dict(),
                'existing_document': None,
                'chunks_created': len(chunks),
                'file_path': final_file_path
            }
            
        except Exception as e:
            # Clean up temp file if it exists
            if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            raise Exception(f"Failed to process document upload: {str(e)}")
