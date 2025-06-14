"""
Data models for the application.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
import json
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.extensions import db


class User(db.Model):
    """User model."""
    __tablename__ = 'users'
    
    id = Column(String(36), primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # 'student' or 'admin'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    topics = relationship("Topic", back_populates="creator", lazy="dynamic")
    chat_sessions = relationship("ChatSession", back_populates="user", lazy="dynamic")
    
    def __init__(self, id: str, name: str, email: str, password_hash: str, role: str, created_at: datetime = None):
        self.id = id
        self.name = name
        self.email = email
        self.password_hash = password_hash
        self.role = role
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert user to dictionary (excluding password hash)."""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'createdAt': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<User {self.email}>'


class Topic(db.Model):
    """Topic model."""
    __tablename__ = 'topics'
    
    id = Column(String(36), primary_key=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    created_by = Column(String(36), ForeignKey('users.id'), nullable=False)
    document_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    creator = relationship("User", back_populates="topics")
    chat_sessions = relationship("ChatSession", back_populates="topic", lazy="dynamic")
    
    def __init__(self, id: str, name: str, description: str, created_by: str, 
                 document_count: int = 0, created_at: datetime = None, updated_at: datetime = None):
        self.id = id
        self.name = name
        self.description = description
        self.created_by = created_by
        self.document_count = document_count
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
    
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
    
    def __repr__(self):
        return f'<Topic {self.name}>'


class ChatSession(db.Model):
    """Chat session model."""
    __tablename__ = 'chat_sessions'
    
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    topic_id = Column(String(36), ForeignKey('topics.id'), nullable=False)
    title = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    topic = relationship("Topic", back_populates="chat_sessions")
    messages = relationship("Message", back_populates="session", lazy="dynamic")
    
    def __init__(self, id: str, user_id: str, topic_id: str, title: str, created_at: datetime = None):
        self.id = id
        self.user_id = user_id
        self.topic_id = topic_id
        self.title = title
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert chat session to dictionary."""
        return {
            'id': self.id,
            'userId': self.user_id,
            'topicId': self.topic_id,
            'title': self.title,
            'createdAt': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<ChatSession {self.title}>'


class Message(db.Model):
    """Message model."""
    __tablename__ = 'messages'
    
    id = Column(String(36), primary_key=True)
    session_id = Column(String(36), ForeignKey('chat_sessions.id'), nullable=False)
    sender = Column(String(20), nullable=False)  # 'user' or 'assistant'
    message = Column(Text, nullable=False)
    sources = Column(Text)  # JSON string of source list
    rating = Column(String(20))  # 'positive', 'negative', or None
    attachment_filename = Column(String(255))  # Original filename of attachment
    attachment_path = Column(String(500))  # File path on server
    attachment_size = Column(Integer)  # File size in bytes
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    
    def __init__(self, id: str, session_id: str, sender: str, message: str, 
                 sources: Optional[List[str]] = None, rating: Optional[str] = None, 
                 attachment_filename: Optional[str] = None, attachment_path: Optional[str] = None,
                 attachment_size: Optional[int] = None, created_at: datetime = None):
        self.id = id
        self.session_id = session_id
        self.sender = sender
        self.message = message
        self.sources = json.dumps(sources) if sources else None
        self.rating = rating
        self.attachment_filename = attachment_filename
        self.attachment_path = attachment_path
        self.attachment_size = attachment_size
        self.created_at = created_at or datetime.utcnow()
    
    @property
    def sources_list(self) -> List[str]:
        """Get sources as a list."""
        if self.sources:
            try:
                return json.loads(self.sources)
            except json.JSONDecodeError:
                return []
        return []
    
    @sources_list.setter
    def sources_list(self, value: Optional[List[str]]):
        """Set sources from a list."""
        self.sources = json.dumps(value) if value else None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert message to dictionary."""
        return {
            'id': self.id,
            'sessionId': self.session_id,
            'sender': self.sender,
            'message': self.message,
            'sources': self.sources_list,
            'rating': self.rating,
            'timestamp': self.created_at.isoformat(),
            'attachment': {
                'filename': self.attachment_filename,
                'size': self.attachment_size
            } if self.attachment_filename else None
        }
    
    def __repr__(self):
        return f'<Message {self.sender}: {self.message[:50]}...>'
