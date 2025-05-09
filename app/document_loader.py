"""
Document loader for processing PDF files.
Handles loading PDFs and splitting them into manageable chunks.
"""
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter


def load_and_split_pdf(file_path, chunk_size=500, chunk_overlap=50):
    """
    Uses PyPDFLoader and LangChain's CharacterTextSplitter
    to extract text and chunk it intelligently.
    
    Args:
        file_path (str): Path to the PDF file to load.
        chunk_size (int): Size of text chunks in characters.
        chunk_overlap (int): Overlap between chunks in characters.
        
    Returns:
        list: List of document chunks ready for embedding.
    """
    # Load PDF document
    loader = PyPDFLoader(file_path)
    pages = loader.load()
    
    # Split the document into chunks for better processing
    splitter = CharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separator="\n"
    )
    
    # Return the split documents
    return splitter.split_documents(pages)