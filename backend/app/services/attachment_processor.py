"""
Attachment processing service for handling various file types in chat messages.
This service extracts content from uploaded attachments to provide context to the AI.
"""
import os
import tempfile
from typing import Optional, Dict, List
from pathlib import Path
import mimetypes

from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    UnstructuredWordDocumentLoader,
    UnstructuredExcelLoader,
    UnstructuredPowerPointLoader
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document


class AttachmentProcessor:
    """Service for processing different types of file attachments."""
    
    # Supported file types and their processors
    SUPPORTED_TYPES = {
        '.pdf': 'process_pdf',
        '.txt': 'process_text',
        '.doc': 'process_word',
        '.docx': 'process_word',
        '.xls': 'process_excel',
        '.xlsx': 'process_excel',
        '.ppt': 'process_powerpoint',
        '.pptx': 'process_powerpoint',
        '.csv': 'process_csv',
        '.rtf': 'process_text',
    }
    
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        """Initialize the attachment processor."""
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
    
    def is_supported_file(self, filename: str) -> bool:
        """Check if file type is supported for content extraction."""
        if not filename:
            return False
        extension = Path(filename).suffix.lower()
        return extension in self.SUPPORTED_TYPES
    
    def extract_content(self, file_path: str, original_filename: str) -> Optional[Dict]:
        """
        Extract content from attachment file.
        
        Args:
            file_path: Path to the uploaded file
            original_filename: Original filename for context
            
        Returns:
            Dictionary containing extracted content and metadata
        """
        try:
            if not os.path.exists(file_path):
                return None
            
            extension = Path(original_filename).suffix.lower()
            
            if not self.is_supported_file(original_filename):
                return {
                    'content': f"File '{original_filename}' uploaded but content extraction not supported for this file type.",
                    'chunks': [],
                    'metadata': {
                        'filename': original_filename,
                        'file_size': os.path.getsize(file_path),
                        'supported': False
                    }
                }
            
            # Get the appropriate processor method
            processor_method = getattr(self, self.SUPPORTED_TYPES[extension])
            
            # Extract content using the appropriate processor
            documents = processor_method(file_path)
            
            if not documents:
                return {
                    'content': f"No content could be extracted from '{original_filename}'.",
                    'chunks': [],
                    'metadata': {
                        'filename': original_filename,
                        'file_size': os.path.getsize(file_path),
                        'supported': True
                    }
                }
            
            # Split into chunks for better processing
            chunks = self.text_splitter.split_documents(documents)
            
            # Combine all content for context
            full_content = "\n".join([doc.page_content for doc in documents])
            
            # Limit content length to prevent overwhelming the AI
            if len(full_content) > 4000:  # Reasonable limit for context
                full_content = full_content[:4000] + "\n... [Content truncated]"
            
            return {
                'content': full_content,
                'chunks': [chunk.page_content for chunk in chunks[:10]],  # Limit chunks
                'metadata': {
                    'filename': original_filename,
                    'file_size': os.path.getsize(file_path),
                    'supported': True,
                    'chunk_count': len(chunks),
                    'content_length': len(full_content)
                }
            }
            
        except Exception as e:
            return {
                'content': f"Error processing '{original_filename}': {str(e)}",
                'chunks': [],
                'metadata': {
                    'filename': original_filename,
                    'file_size': os.path.getsize(file_path) if os.path.exists(file_path) else 0,
                    'supported': False,
                    'error': str(e)
                }
            }
    
    def process_pdf(self, file_path: str) -> List[Document]:
        """Process PDF file."""
        try:
            loader = PyPDFLoader(file_path)
            return loader.load()
        except Exception as e:
            raise Exception(f"Failed to process PDF: {str(e)}")
    
    def process_text(self, file_path: str) -> List[Document]:
        """Process text file (txt, rtf)."""
        try:
            loader = TextLoader(file_path, encoding='utf-8')
            return loader.load()
        except UnicodeDecodeError:
            # Try with different encoding
            try:
                loader = TextLoader(file_path, encoding='latin-1')
                return loader.load()
            except Exception as e:
                raise Exception(f"Failed to process text file: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to process text file: {str(e)}")
    
    def process_word(self, file_path: str) -> List[Document]:
        """Process Word document (doc, docx)."""
        try:
            loader = UnstructuredWordDocumentLoader(file_path)
            return loader.load()
        except Exception as e:
            raise Exception(f"Failed to process Word document: {str(e)}")
    
    def process_excel(self, file_path: str) -> List[Document]:
        """Process Excel file (xls, xlsx)."""
        try:
            loader = UnstructuredExcelLoader(file_path)
            return loader.load()
        except Exception as e:
            raise Exception(f"Failed to process Excel file: {str(e)}")
    
    def process_powerpoint(self, file_path: str) -> List[Document]:
        """Process PowerPoint file (ppt, pptx)."""
        try:
            loader = UnstructuredPowerPointLoader(file_path)
            return loader.load()
        except Exception as e:
            raise Exception(f"Failed to process PowerPoint file: {str(e)}")
    
    def process_csv(self, file_path: str) -> List[Document]:
        """Process CSV file."""
        try:
            import pandas as pd
            
            # Read CSV and convert to text representation
            df = pd.read_csv(file_path)
            
            # Create a text representation of the CSV
            content = f"CSV File Content:\n"
            content += f"Columns: {', '.join(df.columns.tolist())}\n"
            content += f"Number of rows: {len(df)}\n\n"
            
            # Add first few rows as sample
            if len(df) > 0:
                content += "Sample data:\n"
                content += df.head(10).to_string(index=False)
                
                if len(df) > 10:
                    content += f"\n... and {len(df) - 10} more rows"
            
            # Create document
            document = Document(
                page_content=content,
                metadata={'source': file_path, 'type': 'csv'}
            )
            
            return [document]
            
        except Exception as e:
            raise Exception(f"Failed to process CSV file: {str(e)}")
    
    def create_attachment_context(self, content_data: Dict, user_question: str) -> str:
        """
        Create enhanced context that includes attachment content.
        
        Args:
            content_data: Extracted content data from attachment
            user_question: User's question
            
        Returns:
            Enhanced context string
        """
        if not content_data or not content_data.get('content'):
            return user_question
        
        filename = content_data.get('metadata', {}).get('filename', 'uploaded file')
        content = content_data.get('content', '')
        
        enhanced_context = f"""
The user has uploaded a file named '{filename}' and is asking a question about it.

File Content:
{content}

User's Question: {user_question}

Please answer the user's question based on both the uploaded file content and any relevant information from the course materials. If the question is specifically about the uploaded file, prioritize information from the file content.
"""
        
        return enhanced_context.strip()
