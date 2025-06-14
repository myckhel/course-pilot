"""
File upload utilities for handling attachments.
"""
import os
import uuid
import mimetypes
from typing import Optional, Tuple, List
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename
from pathlib import Path


class FileUploadService:
    """Service for handling file uploads."""
    
    # Allowed file extensions for attachments
    ALLOWED_EXTENSIONS = {
        '.pdf', '.doc', '.docx', '.txt', '.rtf',
        '.png', '.jpg', '.jpeg', '.gif', '.bmp',
        '.xls', '.xlsx', '.csv',
        '.ppt', '.pptx'
    }
    
    # Maximum file size (5MB in bytes)
    MAX_FILE_SIZE = 5 * 1024 * 1024
    
    def __init__(self, upload_dir: str = "uploads/attachments"):
        """Initialize file upload service."""
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def is_allowed_file(self, filename: str) -> bool:
        """Check if file extension is allowed."""
        if not filename:
            return False
        return Path(filename).suffix.lower() in self.ALLOWED_EXTENSIONS
    
    def validate_file(self, file: FileStorage) -> Tuple[bool, Optional[str]]:
        """Validate uploaded file."""
        if not file or not file.filename:
            return False, "No file provided"
        
        if not self.is_allowed_file(file.filename):
            return False, f"File type not allowed. Allowed types: {', '.join(self.ALLOWED_EXTENSIONS)}"
        
        # Check file size (if we can read the content)
        if hasattr(file, 'content_length') and file.content_length:
            if file.content_length > self.MAX_FILE_SIZE:
                return False, f"File too large. Maximum size: {self.MAX_FILE_SIZE / (1024*1024):.1f}MB"
        
        return True, None
    
    def save_file(self, file: FileStorage, session_id: str) -> Tuple[str, str, int]:
        """
        Save uploaded file and return (filename, file_path, file_size).
        
        Args:
            file: The uploaded file
            session_id: Chat session ID for organizing files
            
        Returns:
            Tuple of (original_filename, saved_file_path, file_size)
        """
        # Validate file
        is_valid, error_msg = self.validate_file(file)
        if not is_valid:
            raise ValueError(error_msg)
        
        # Create session directory
        session_dir = self.upload_dir / session_id
        session_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        file_extension = Path(original_filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = session_dir / unique_filename
        
        # Save file
        file.save(str(file_path))
        
        # Get file size
        file_size = file_path.stat().st_size
        
        # Validate file size after saving
        if file_size > self.MAX_FILE_SIZE:
            file_path.unlink()  # Delete the file
            raise ValueError(f"File too large. Maximum size: {self.MAX_FILE_SIZE / (1024*1024):.1f}MB")
        
        return original_filename, str(file_path), file_size
    
    def delete_file(self, file_path: str) -> bool:
        """Delete a file."""
        try:
            Path(file_path).unlink(missing_ok=True)
            return True
        except Exception:
            return False
    
    def get_file_info(self, file_path: str) -> Optional[dict]:
        """Get information about a file."""
        try:
            path = Path(file_path)
            if not path.exists():
                return None
            
            stat = path.stat()
            mime_type, _ = mimetypes.guess_type(str(path))
            
            return {
                'filename': path.name,
                'size': stat.st_size,
                'mime_type': mime_type,
                'created_at': stat.st_ctime,
                'modified_at': stat.st_mtime
            }
        except Exception:
            return None
    
    def cleanup_session_files(self, session_id: str) -> bool:
        """Clean up all files for a session."""
        try:
            session_dir = self.upload_dir / session_id
            if session_dir.exists():
                for file_path in session_dir.iterdir():
                    if file_path.is_file():
                        file_path.unlink()
                session_dir.rmdir()
            return True
        except Exception:
            return False
