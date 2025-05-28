"""
Data models for the application.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List, Dict, Any
import json


@dataclass
class User:
    """User model."""
    id: str
    name: str
    email: str
    password_hash: str
    role: str  # 'student' or 'admin'
    created_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert user to dictionary (excluding password hash)."""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'createdAt': self.created_at.isoformat()
        }


@dataclass
class Topic:
    """Topic model."""
    id: str
    name: str
    description: str
    created_by: str
    document_count: int
    created_at: datetime
    updated_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert topic to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'createdBy': self.created_by,
            'documentCount': self.document_count,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }


@dataclass
class ChatSession:
    """Chat session model."""
    id: str
    user_id: str
    topic_id: str
    title: str
    created_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert chat session to dictionary."""
        return {
            'id': self.id,
            'userId': self.user_id,
            'topicId': self.topic_id,
            'title': self.title,
            'createdAt': self.created_at.isoformat()
        }


@dataclass
class Message:
    """Message model."""
    id: str
    session_id: str
    sender: str  # 'user' or 'assistant'
    message: str
    sources: Optional[List[str]]
    created_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert message to dictionary."""
        return {
            'id': self.id,
            'sessionId': self.session_id,
            'sender': self.sender,
            'message': self.message,
            'sources': self.sources or [],
            'timestamp': self.created_at.isoformat()
        }
