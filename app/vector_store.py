"""
Vector store module for embedding and retrieving document chunks.
Uses ChromaDB for efficient similarity search.
"""
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings.openai import OpenAIEmbeddings
import os
import shutil


def create_vector_store(chunks, path="chroma_db"):
    """
    Create and persist a ChromaDB vector store from given document chunks.
    
    Args:
        chunks (list): List of document chunks to embed and index.
        path (str): Directory path to save the ChromaDB index.
        
    Returns:
        None: The index is saved to disk at the specified path.
    """
    # Clean up existing DB if it exists
    if os.path.exists(path):
        shutil.rmtree(path)
        
    # Initialize OpenAI embeddings
    embeddings = OpenAIEmbeddings()
    
    # Create the vector store with document chunks
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=path
    )
    
    # Persist the database
    vectorstore.persist()


def load_retriever(path="chroma_db"):
    """
    Loads ChromaDB index and returns retriever for semantic search.
    
    Args:
        path (str): Directory path where the ChromaDB index is stored.
        
    Returns:
        Retriever: A retriever object for semantic search.
    """
    # Initialize OpenAI embeddings
    embeddings = OpenAIEmbeddings()
    
    # Load the vector store from disk
    vectorstore = Chroma(
        persist_directory=path,
        embedding_function=embeddings
    )
    
    # Return the retriever for semantic search
    return vectorstore.as_retriever(search_kwargs={"k": 4})
