"""
Vector store service for managing Chroma embeddings.
"""
import os
import shutil
from typing import List, Optional
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.schema import Document


class VectorStoreService:
    """Service for managing vector store operations."""
    
    def __init__(self, persist_directory: str):
        self.persist_directory = persist_directory
        self.embeddings = OpenAIEmbeddings()
        
        # Ensure persist directory exists
        os.makedirs(persist_directory, exist_ok=True)
    
    def create_topic_index(self, topic_id: str, documents: List[Document]) -> bool:
        """
        Create vector index for a specific topic.
        
        Args:
            topic_id: Unique identifier for the topic
            documents: List of documents to index
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not documents:
                raise ValueError("No documents provided for indexing")
            
            topic_persist_dir = os.path.join(self.persist_directory, topic_id)
            
            # Create vectorstore
            vectorstore = Chroma.from_documents(
                documents=documents,
                embedding=self.embeddings,
                persist_directory=topic_persist_dir
            )
            
            # Persist the vectorstore
            vectorstore.persist()
            
            return True
            
        except Exception as e:
            raise Exception(f"Failed to create vector index: {str(e)}")
    
    def get_topic_retriever(self, topic_id: str, search_kwargs: Optional[dict] = None):
        """
        Get retriever for a specific topic.
        
        Args:
            topic_id: Unique identifier for the topic
            search_kwargs: Optional search parameters
            
        Returns:
            Retriever object for the topic
        """
        try:
            topic_persist_dir = os.path.join(self.persist_directory, topic_id)
            
            if not os.path.exists(topic_persist_dir):
                raise ValueError(f"No vector store found for topic: {topic_id}")
            
            # Load existing vectorstore
            vectorstore = Chroma(
                persist_directory=topic_persist_dir,
                embedding_function=self.embeddings
            )
            
            # Configure search parameters
            if search_kwargs is None:
                search_kwargs = {"k": 4}  # Return top 4 most relevant chunks
            
            return vectorstore.as_retriever(search_kwargs=search_kwargs)
            
        except Exception as e:
            raise Exception(f"Failed to load retriever: {str(e)}")
    
    def update_topic_index(self, topic_id: str, new_documents: List[Document]) -> bool:
        """
        Update existing topic index with new documents.
        
        Args:
            topic_id: Unique identifier for the topic
            new_documents: List of new documents to add
            
        Returns:
            True if successful, False otherwise
        """
        try:
            topic_persist_dir = os.path.join(self.persist_directory, topic_id)
            
            if os.path.exists(topic_persist_dir):
                # Load existing vectorstore
                vectorstore = Chroma(
                    persist_directory=topic_persist_dir,
                    embedding_function=self.embeddings
                )
                
                # Add new documents
                vectorstore.add_documents(new_documents)
            else:
                # Create new vectorstore if it doesn't exist
                vectorstore = Chroma.from_documents(
                    documents=new_documents,
                    embedding=self.embeddings,
                    persist_directory=topic_persist_dir
                )
            
            # Persist changes
            vectorstore.persist()
            
            return True
            
        except Exception as e:
            raise Exception(f"Failed to update vector index: {str(e)}")
    
    def delete_topic_index(self, topic_id: str) -> bool:
        """
        Delete vector index for a topic.
        
        Args:
            topic_id: Unique identifier for the topic
            
        Returns:
            True if successful, False otherwise
        """
        try:
            topic_persist_dir = os.path.join(self.persist_directory, topic_id)
            
            if os.path.exists(topic_persist_dir):
                shutil.rmtree(topic_persist_dir)
                return True
            else:
                # Index doesn't exist, consider it successfully deleted
                return True
                
        except Exception as e:
            raise Exception(f"Failed to delete index: {str(e)}")
    
    def topic_index_exists(self, topic_id: str) -> bool:
        """
        Check if a topic index exists.
        
        Args:
            topic_id: Unique identifier for the topic
            
        Returns:
            True if index exists, False otherwise
        """
        topic_persist_dir = os.path.join(self.persist_directory, topic_id)
        return os.path.exists(topic_persist_dir)
    
    def get_topic_document_count(self, topic_id: str) -> int:
        """
        Get the number of documents in a topic's vector store.
        
        Args:
            topic_id: Unique identifier for the topic
            
        Returns:
            Number of documents in the vector store
        """
        try:
            if not self.topic_index_exists(topic_id):
                return 0
            
            topic_persist_dir = os.path.join(self.persist_directory, topic_id)
            
            # Load vectorstore and get collection
            vectorstore = Chroma(
                persist_directory=topic_persist_dir,
                embedding_function=self.embeddings
            )
            
            # Get collection info
            collection = vectorstore._collection
            return collection.count()
            
        except Exception:
            return 0
    
    def search_topic_documents(self, topic_id: str, query: str, k: int = 4) -> List[Document]:
        """
        Search documents in a topic's vector store.
        
        Args:
            topic_id: Unique identifier for the topic
            query: Search query
            k: Number of results to return
            
        Returns:
            List of relevant documents
        """
        try:
            retriever = self.get_topic_retriever(topic_id, {"k": k})
            return retriever.get_relevant_documents(query)
            
        except Exception as e:
            raise Exception(f"Failed to search topic documents: {str(e)}")
    
    def get_all_topic_ids(self) -> List[str]:
        """
        Get list of all topic IDs that have vector stores.
        
        Returns:
            List of topic IDs
        """
        try:
            if not os.path.exists(self.persist_directory):
                return []
            
            topic_ids = []
            for item in os.listdir(self.persist_directory):
                item_path = os.path.join(self.persist_directory, item)
                if os.path.isdir(item_path):
                    topic_ids.append(item)
            
            return topic_ids
            
        except Exception:
            return []
