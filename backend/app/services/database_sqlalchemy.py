"""
Database service for managing SQLAlchemy ORM operations.
"""
import uuid
import json
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import sessionmaker
from sqlalchemy import func, desc, and_, or_
from app.extensions import db
from app.models import User, Topic, ChatSession, Message


class DatabaseService:
    """Service for database operations using SQLAlchemy ORM."""
    
    def __init__(self):
        """Initialize database service."""
        pass
    
    # User methods
    def create_user(self, name: str, email: str, password: str, role: str) -> User:
        """Create a new user."""
        user_id = str(uuid.uuid4())
        password_hash = generate_password_hash(password, method='pbkdf2:sha256')
        
        try:
            user = User(
                id=user_id,
                name=name,
                email=email,
                password_hash=password_hash,
                role=role
            )
            db.session.add(user)
            db.session.commit()
            return user
        except IntegrityError:
            db.session.rollback()
            raise ValueError("User with this email already exists")
        except SQLAlchemyError as e:
            db.session.rollback()
            raise RuntimeError(f"Database error: {str(e)}")
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password."""
        try:
            user = User.query.filter_by(email=email).first()
            if user and check_password_hash(user.password_hash, password):
                return user
            return None
        except SQLAlchemyError:
            return None
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        try:
            return User.query.filter_by(id=user_id).first()
        except SQLAlchemyError:
            return None
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        try:
            return User.query.filter_by(email=email).first()
        except SQLAlchemyError:
            return None
    
    def update_user(self, user_id: str, name: str = None, email: str = None, role: str = None) -> Optional[User]:
        """Update user information."""
        try:
            user = User.query.filter_by(id=user_id).first()
            if not user:
                return None
            
            if name is not None:
                user.name = name
            if email is not None:
                user.email = email
            if role is not None:
                user.role = role
            
            db.session.commit()
            return user
        except IntegrityError:
            db.session.rollback()
            raise ValueError("Email already exists")
        except SQLAlchemyError as e:
            db.session.rollback()
            raise RuntimeError(f"Database error: {str(e)}")
    
    def update_user_password(self, user_id: str, new_password: str) -> bool:
        """Update user password."""
        try:
            user = User.query.filter_by(id=user_id).first()
            if not user:
                return False
            
            password_hash = generate_password_hash(new_password, method='pbkdf2:sha256')
            user.password_hash = password_hash
            db.session.commit()
            return True
        except SQLAlchemyError:
            db.session.rollback()
            return False
    
    def get_user_stats(self, user_id: str) -> dict:
        """Get user statistics."""
        try:
            # Total chat sessions for user
            total_sessions = ChatSession.query.filter_by(user_id=user_id).count()
            
            # Total messages from user
            total_messages = db.session.query(Message).join(ChatSession).filter(
                ChatSession.user_id == user_id,
                Message.sender == 'user'
            ).count()
            
            # Get recent activity (last 7 days)
            seven_days_ago = datetime.utcnow() - timedelta(days=7)
            recent_sessions = ChatSession.query.filter(
                ChatSession.user_id == user_id,
                ChatSession.created_at >= seven_days_ago
            ).count()
            
            return {
                'total_sessions': total_sessions,
                'total_messages': total_messages,
                'recent_sessions': recent_sessions
            }
        except SQLAlchemyError:
            return {
                'total_sessions': 0,
                'total_messages': 0,
                'recent_sessions': 0
            }
    
    def get_all_users(self, limit: int = 100, offset: int = 0) -> Tuple[List[User], int]:
        """Get all users with pagination."""
        try:
            # Get total count
            total_count = User.query.count()
            
            # Get users with pagination
            users = User.query.order_by(User.created_at.desc()).limit(limit).offset(offset).all()
            
            return users, total_count
        except SQLAlchemyError:
            return [], 0
    
    # Topic methods
    def create_topic(self, name: str, description: str, created_by: str) -> Topic:
        """Create a new topic."""
        try:
            topic_id = str(uuid.uuid4())
            now = datetime.utcnow()
            
            topic = Topic(
                id=topic_id,
                name=name,
                description=description,
                created_by=created_by,
                created_at=now,
                updated_at=now
            )
            
            db.session.add(topic)
            db.session.commit()
            return topic
        except SQLAlchemyError as e:
            db.session.rollback()
            raise RuntimeError(f"Database error: {str(e)}")
    
    def get_topic_by_id(self, topic_id: str) -> Optional[Topic]:
        """Get topic by ID."""
        try:
            return Topic.query.filter_by(id=topic_id).first()
        except SQLAlchemyError:
            return None
    
    def get_all_topics(self) -> List[Topic]:
        """Get all topics."""
        try:
            return Topic.query.order_by(Topic.created_at.desc()).all()
        except SQLAlchemyError:
            return []
    
    def update_topic(self, topic_id: str, name: str = None, description: str = None) -> Optional[Topic]:
        """Update topic information."""
        try:
            topic = Topic.query.filter_by(id=topic_id).first()
            if not topic:
                return None
            
            if name is not None:
                topic.name = name
            if description is not None:
                topic.description = description
            
            topic.updated_at = datetime.utcnow()
            db.session.commit()
            return topic
        except SQLAlchemyError as e:
            db.session.rollback()
            raise RuntimeError(f"Database error: {str(e)}")
    
    def increment_topic_document_count(self, topic_id: str) -> bool:
        """Increment the document count for a topic."""
        try:
            topic = Topic.query.filter_by(id=topic_id).first()
            if not topic:
                return False
            
            topic.document_count += 1
            topic.updated_at = datetime.utcnow()
            db.session.commit()
            return True
        except SQLAlchemyError:
            db.session.rollback()
            return False
    
    def get_topic_document_count(self, topic_id: str) -> int:
        """Get the document count for a topic."""
        try:
            topic = Topic.query.filter_by(id=topic_id).first()
            return topic.document_count if topic else 0
        except SQLAlchemyError:
            return 0
    
    # Chat session methods
    def create_chat_session(self, user_id: str, topic_id: str, title: str) -> ChatSession:
        """Create a new chat session."""
        try:
            session_id = str(uuid.uuid4())
            session = ChatSession(
                id=session_id,
                user_id=user_id,
                topic_id=topic_id,
                title=title
            )
            
            db.session.add(session)
            db.session.commit()
            return session
        except SQLAlchemyError as e:
            db.session.rollback()
            raise RuntimeError(f"Database error: {str(e)}")
    
    def get_chat_session_by_id(self, session_id: str) -> Optional[ChatSession]:
        """Get chat session by ID."""
        try:
            return ChatSession.query.filter_by(id=session_id).first()
        except SQLAlchemyError:
            return None
    
    def get_user_chat_sessions(self, user_id: str, topic_id: str = None) -> List[ChatSession]:
        """Get all chat sessions for a user, optionally filtered by topic."""
        try:
            query = ChatSession.query.filter_by(user_id=user_id)
            
            if topic_id:
                query = query.filter_by(topic_id=topic_id)
            
            return query.order_by(ChatSession.created_at.desc()).all()
        except SQLAlchemyError:
            return []
    
    def delete_chat_session(self, session_id: str) -> bool:
        """Delete a chat session and all its messages."""
        try:
            # First delete all messages in the session
            Message.query.filter_by(session_id=session_id).delete()
            
            # Then delete the session
            session = ChatSession.query.filter_by(id=session_id).first()
            if session:
                db.session.delete(session)
                db.session.commit()
                return True
            return False
        except SQLAlchemyError:
            db.session.rollback()
            return False
    
    # Message methods
    def create_message(self, session_id: str, sender: str, message: str, 
                      sources: Optional[List[str]] = None) -> Message:
        """Create a new message."""
        try:
            message_id = str(uuid.uuid4())
            msg = Message(
                id=message_id,
                session_id=session_id,
                sender=sender,
                message=message,
                sources=sources
            )
            
            db.session.add(msg)
            db.session.commit()
            return msg
        except SQLAlchemyError as e:
            db.session.rollback()
            raise RuntimeError(f"Database error: {str(e)}")
    
    def get_session_messages(self, session_id: str, limit: int = 100) -> List[Message]:
        """Get all messages for a chat session."""
        try:
            return Message.query.filter_by(session_id=session_id)\
                .order_by(Message.created_at.asc())\
                .limit(limit).all()
        except SQLAlchemyError:
            return []
    
    def update_message_rating(self, message_id: str, rating: str) -> bool:
        """Update the rating for a message."""
        try:
            message = Message.query.filter_by(id=message_id).first()
            if not message:
                return False
            
            message.rating = rating
            db.session.commit()
            return True
        except SQLAlchemyError:
            db.session.rollback()
            return False
    
    def get_message_by_id(self, message_id: str) -> Optional[Message]:
        """Get message by ID."""
        try:
            return Message.query.filter_by(id=message_id).first()
        except SQLAlchemyError:
            return None
    
    # Admin methods
    def get_admin_stats(self) -> dict:
        """Get admin dashboard statistics."""
        try:
            # Total users
            total_users = User.query.count()
            
            # Total topics
            total_topics = Topic.query.count()
            
            # Total chat sessions
            total_sessions = ChatSession.query.count()
            
            # Total messages
            total_messages = Message.query.count()
            
            # Recent activity (last 7 days)
            seven_days_ago = datetime.utcnow() - timedelta(days=7)
            recent_users = User.query.filter(User.created_at >= seven_days_ago).count()
            recent_sessions = ChatSession.query.filter(ChatSession.created_at >= seven_days_ago).count()
            
            # Popular topics (by session count)
            popular_topics = db.session.query(
                Topic.id,
                Topic.name,
                func.count(ChatSession.id).label('session_count')
            ).outerjoin(ChatSession).group_by(Topic.id, Topic.name)\
            .order_by(desc('session_count')).limit(5).all()
            
            return {
                'total_users': total_users,
                'total_topics': total_topics,
                'total_sessions': total_sessions,
                'total_messages': total_messages,
                'recent_users': recent_users,
                'recent_sessions': recent_sessions,
                'popular_topics': [
                    {
                        'id': topic.id,
                        'name': topic.name,
                        'session_count': topic.session_count
                    }
                    for topic in popular_topics
                ]
            }
        except SQLAlchemyError:
            return {
                'total_users': 0,
                'total_topics': 0,
                'total_sessions': 0,
                'total_messages': 0,
                'recent_users': 0,
                'recent_sessions': 0,
                'popular_topics': []
            }
    
    def get_recent_activity(self, limit: int = 10) -> List[dict]:
        """Get recent activity across the system."""
        try:
            # Get recent chat sessions with user and topic info
            recent_sessions = db.session.query(
                ChatSession.id,
                ChatSession.title,
                ChatSession.created_at,
                User.name.label('user_name'),
                Topic.name.label('topic_name')
            ).join(User).join(Topic)\
            .order_by(ChatSession.created_at.desc())\
            .limit(limit).all()
            
            activities = []
            for session in recent_sessions:
                activities.append({
                    'type': 'chat_session',
                    'id': session.id,
                    'title': session.title,
                    'user_name': session.user_name,
                    'topic_name': session.topic_name,
                    'created_at': session.created_at.isoformat()
                })
            
            return activities
        except SQLAlchemyError:
            return []
    
    def search_users(self, query: str, limit: int = 50) -> List[User]:
        """Search users by name or email."""
        try:
            search_pattern = f"%{query}%"
            return User.query.filter(
                or_(
                    User.name.ilike(search_pattern),
                    User.email.ilike(search_pattern)
                )
            ).limit(limit).all()
        except SQLAlchemyError:
            return []
    
    def search_topics(self, query: str, limit: int = 50) -> List[Topic]:
        """Search topics by name or description."""
        try:
            search_pattern = f"%{query}%"
            return Topic.query.filter(
                or_(
                    Topic.name.ilike(search_pattern),
                    Topic.description.ilike(search_pattern)
                )
            ).limit(limit).all()
        except SQLAlchemyError:
            return []
