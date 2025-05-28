"""
Document loading and processing service.
"""
import os
import uuid
import tempfile
from typing import List
from werkzeug.utils import secure_filename
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.schema import Document


class DocumentLoader:
    """Service for loading and processing documents."""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = CharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
    
    def load_and_split_pdf(self, file_path: str) -> List[Document]:
        """
        Load PDF and split into chunks for embedding.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            List of document chunks
        """
        try:
            loader = PyPDFLoader(file_path)
            pages = loader.load()
            
            if not pages:
                raise ValueError("No content found in PDF")
            
            # Split documents into chunks
            chunks = self.text_splitter.split_documents(pages)
            
            if not chunks:
                raise ValueError("No chunks created from PDF")
            
            return chunks
            
        except Exception as e:
            raise Exception(f"Failed to load and split PDF: {str(e)}")
    
    def save_uploaded_file(self, file, upload_folder: str, topic_id: str) -> str:
        """
        Save uploaded file and return file path.
        
        Args:
            file: Uploaded file object
            upload_folder: Directory to save the file
            topic_id: ID of the topic
            
        Returns:
            Path to the saved file
        """
        try:
            # Ensure upload folder exists
            os.makedirs(upload_folder, exist_ok=True)
            
            # Create topic-specific folder
            topic_folder = os.path.join(upload_folder, topic_id)
            os.makedirs(topic_folder, exist_ok=True)
            
            # Generate unique filename
            filename = secure_filename(file.filename)
            if not filename:
                filename = f"document_{uuid.uuid4()}.pdf"
            
            # Add unique identifier to prevent overwrites
            name, ext = os.path.splitext(filename)
            unique_filename = f"{name}_{uuid.uuid4()}{ext}"
            
            file_path = os.path.join(topic_folder, unique_filename)
            
            # Save file
            file.save(file_path)
            
            return file_path
            
        except Exception as e:
            raise Exception(f"Failed to save uploaded file: {str(e)}")
    
    def validate_pdf_file(self, file) -> bool:
        """
        Validate if the uploaded file is a valid PDF.
        
        Args:
            file: Uploaded file object
            
        Returns:
            True if valid PDF, False otherwise
        """
        if not file or not file.filename:
            return False
        
        # Check file extension
        if not file.filename.lower().endswith('.pdf'):
            return False
        
        # Check file size (should be handled by Flask config, but double-check)
        file.seek(0, 2)  # Seek to end
        size = file.tell()
        file.seek(0)  # Reset to beginning
        
        # 16MB limit
        if size > 16 * 1024 * 1024:
            return False
        
        return True
    
    def load_pdf_from_bytes(self, pdf_bytes: bytes) -> List[Document]:
        """
        Load PDF from bytes and split into chunks.
        
        Args:
            pdf_bytes: PDF file as bytes
            
        Returns:
            List of document chunks
        """
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
                tmp_file.write(pdf_bytes)
                tmp_path = tmp_file.name
            
            try:
                # Load and split the PDF
                chunks = self.load_and_split_pdf(tmp_path)
                return chunks
            finally:
                # Clean up temporary file
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
                    
        except Exception as e:
            raise Exception(f"Failed to load PDF from bytes: {str(e)}")
    
    def get_document_metadata(self, file_path: str) -> dict:
        """
        Extract metadata from a document.
        
        Args:
            file_path: Path to the document
            
        Returns:
            Dictionary containing document metadata
        """
        try:
            stat = os.stat(file_path)
            filename = os.path.basename(file_path)
            
            return {
                'filename': filename,
                'file_size': stat.st_size,
                'created_at': stat.st_ctime,
                'modified_at': stat.st_mtime
            }
            
        except Exception as e:
            raise Exception(f"Failed to get document metadata: {str(e)}")
