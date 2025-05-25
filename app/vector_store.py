"""
Vector store module for embedding and retrieving document chunks.
Uses ChromaDB for efficient similarity search.
"""
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings.openai import OpenAIEmbeddings
import os
import shutil


def create_vector_store(chunks, path=None):
    """
    Create a ChromaDB vector store from given document chunks.
    
    Args:
        chunks (list): List of document chunks to embed and index.
        path (str, optional): Directory path to save the ChromaDB index. If None,
                             uses an in-memory database.
        
    Returns:
        ChromaDB: The vector store instance.
    """
    # Initialize OpenAI embeddings
    embeddings = OpenAIEmbeddings()
    
    try:
        if path is not None:
            # Use a directory in the user's home directory to avoid permission issues
            import os
            home_dir = os.path.expanduser("~")
            abs_path = os.path.join(home_dir, "asked_chroma_db")
            
            # Clean up existing DB if it exists
            if os.path.exists(abs_path):
                shutil.rmtree(abs_path)
            
            # Ensure directory exists with the right permissions
            os.makedirs(abs_path, exist_ok=True)
            
            # Create the vector store with document chunks and persist to disk
            vectorstore = Chroma.from_documents(
                documents=chunks,
                embedding=embeddings,
                persist_directory=abs_path
            )
            
            # Persist the database
            vectorstore.persist()
            return vectorstore
        else:
            # Use in-memory database as fallback
            return Chroma.from_documents(
                documents=chunks,
                embedding=embeddings,
                # No persist_directory means in-memory
            )
    except Exception as e:
        print(f"Error creating vector store: {str(e)}")
        # Fallback to in-memory if there's an error
        return Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            # No persist_directory means in-memory
        )
    
    # Persist the database
    vectorstore.persist()


def load_retriever(vectorstore=None):
    """
    Returns a retriever for semantic search.
    
    Args:
        vectorstore: An existing ChromaDB instance from create_vector_store.
                    If None, assumes last created instance.
        
    Returns:
        Retriever: A retriever object for semantic search.
    """
    if vectorstore is None:
        # Use home directory path for consistent retrieval
        import os
        home_dir = os.path.expanduser("~")
        abs_path = os.path.join(home_dir, "asked_chroma_db")
        
        try:
            # Check if the directory exists and is accessible
            if not os.path.exists(abs_path):
                print(f"ChromaDB directory not found at {abs_path}")
                # We'll return a retriever from the vectorstore passed to ui.py
                return None
                
            # Initialize OpenAI embeddings
            embeddings = OpenAIEmbeddings()
            
            # Load the vector store from disk
            vectorstore = Chroma(
                persist_directory=abs_path,
                embedding_function=embeddings
            )
        except Exception as e:
            print(f"Error loading ChromaDB: {str(e)}")
            return None
    
    # Return the retriever for semantic search
    return vectorstore.as_retriever(search_kwargs={"k": 4})
    
    # Return the retriever for semantic search
    return vectorstore.as_retriever(search_kwargs={"k": 4})


def create_chroma_index_for_topic(topic_id: str, chunks: list, persist_directory: str):
    """
    Creates and stores embeddings for a topic's study material using Chroma.
    Persists embeddings to a topic-specific directory.
    
    Args:
        topic_id (str): Unique identifier for the topic
        chunks (list): List of document chunks to embed
        persist_directory (str): Directory path to persist the embeddings
    """
    # Initialize OpenAI embeddings
    embeddings = OpenAIEmbeddings()
    
    # Ensure the directory exists
    os.makedirs(persist_directory, exist_ok=True)
    
    # Create the vector store with document chunks and persist to disk
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=persist_directory
    )
    
    # Persist the database
    vectorstore.persist()
    return vectorstore


def load_retriever_for_topic(topic_id: str, persist_directory: str):
    """
    Loads a retriever from the Chroma vector store for the given topic.
    Returns a retriever suitable for passing into LangChain RetrievalQA.
    
    Args:
        topic_id (str): Unique identifier for the topic
        persist_directory (str): Directory path where embeddings are stored
        
    Returns:
        Retriever: A retriever object for semantic search
    """
    # Check if the directory exists
    if not os.path.exists(persist_directory):
        raise FileNotFoundError(f"Vector store directory not found: {persist_directory}")
    
    # Initialize OpenAI embeddings
    embeddings = OpenAIEmbeddings()
    
    # Load the vector store from disk
    vectorstore = Chroma(
        persist_directory=persist_directory,
        embedding_function=embeddings
    )
    
    # Return the retriever for semantic search
    return vectorstore.as_retriever(search_kwargs={"k": 4})
