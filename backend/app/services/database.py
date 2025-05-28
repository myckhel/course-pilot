"""
Database service for managing SQLite operations.
"""
import sqlite3
import uuid
import json
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from werkzeug.security import generate_password_hash, check_password_hash
from app.models import User, Topic, ChatSession, Message


class DatabaseService:
    """Service for database operations."""
    
    def __init__(self, db_path: str = "assistant.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database tables."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Topics table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS topics (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_by TEXT NOT NULL,
                    document_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (created_by) REFERENCES users (id)
                )
            """)
            
            # Chat sessions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    topic_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (topic_id) REFERENCES topics (id)
                )
            """)
            
            # Messages table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
                    message TEXT NOT NULL,
                    sources TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
                )
            """)
            
            conn.commit()
    
    # User methods
    def create_user(self, name: str, email: str, password: str, role: str) -> User:
        """Create a new user."""
        user_id = str(uuid.uuid4())
        password_hash = generate_password_hash(password, method='pbkdf2:sha256')
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO users (id, name, email, password_hash, role)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, name, email, password_hash, role))
            conn.commit()
        
        return self.get_user_by_id(user_id)
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password."""
        user = self.get_user_by_email(email)
        if user and check_password_hash(user.password_hash, password):
            return user
        return None
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            
            if row:
                return User(
                    id=row[0],
                    name=row[1],
                    email=row[2],
                    password_hash=row[3],
                    role=row[4],
                    created_at=datetime.fromisoformat(row[5])
                )
        return None
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            row = cursor.fetchone()
            
            if row:
                return User(
                    id=row[0],
                    name=row[1],
                    email=row[2],
                    password_hash=row[3],
                    role=row[4],
                    created_at=datetime.fromisoformat(row[5])
                )
        return None
    
    def update_user(self, user_id: str, name: str = None, email: str = None, role: str = None) -> Optional[User]:
        """Update user information."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Build dynamic update query
            update_fields = []
            params = []
            
            if name is not None:
                update_fields.append("name = ?")
                params.append(name)
            
            if email is not None:
                update_fields.append("email = ?")
                params.append(email)
            
            if role is not None:
                update_fields.append("role = ?")
                params.append(role)
            
            if not update_fields:
                return self.get_user_by_id(user_id)
            
            params.append(user_id)
            
            query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)
            
            if cursor.rowcount > 0:
                return self.get_user_by_id(user_id)
        
        return None
    
    def delete_user(self, user_id: str) -> bool:
        """Delete a user and all associated data."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            try:
                # Delete associated messages first
                cursor.execute("""
                    DELETE FROM messages 
                    WHERE session_id IN (
                        SELECT id FROM chat_sessions WHERE user_id = ?
                    )
                """, (user_id,))
                
                # Delete chat sessions
                cursor.execute("DELETE FROM chat_sessions WHERE user_id = ?", (user_id,))
                
                # Delete topics created by user
                cursor.execute("DELETE FROM topics WHERE created_by = ?", (user_id,))
                
                # Delete the user
                cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
                
                conn.commit()
                return cursor.rowcount > 0
                
            except Exception as e:
                conn.rollback()
                raise e
    
    def get_all_users(self, page: int = 1, page_size: int = 20) -> Tuple[List[User], int]:
        """Get all users with pagination."""
        offset = (page - 1) * page_size
        users = []
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Get total count
            cursor.execute("SELECT COUNT(*) FROM users")
            total_count = cursor.fetchone()[0]
            
            # Get users with pagination
            cursor.execute("""
                SELECT * FROM users 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            """, (page_size, offset))
            rows = cursor.fetchall()
            
            for row in rows:
                users.append(User(
                    id=row[0],
                    name=row[1],
                    email=row[2],
                    password_hash=row[3],
                    role=row[4],
                    created_at=datetime.fromisoformat(row[5])
                ))
        
        return users, total_count
    
    def search_users(self, query: str, page: int = 1, page_size: int = 20) -> Tuple[List[User], int]:
        """Search users by name or email."""
        offset = (page - 1) * page_size
        users = []
        search_pattern = f"%{query}%"
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Get total count
            cursor.execute("""
                SELECT COUNT(*) FROM users 
                WHERE name LIKE ? OR email LIKE ?
            """, (search_pattern, search_pattern))
            total_count = cursor.fetchone()[0]
            
            # Get users with pagination
            cursor.execute("""
                SELECT * FROM users 
                WHERE name LIKE ? OR email LIKE ?
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            """, (search_pattern, search_pattern, page_size, offset))
            rows = cursor.fetchall()
            
            for row in rows:
                users.append(User(
                    id=row[0],
                    name=row[1],
                    email=row[2],
                    password_hash=row[3],
                    role=row[4],
                    created_at=datetime.fromisoformat(row[5])
                ))
        
        return users, total_count
    
    # Topic methods
    def create_topic(self, name: str, description: str, created_by: str) -> Topic:
        """Create a new topic."""
        topic_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO topics (id, name, description, created_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (topic_id, name, description, created_by, now, now))
            conn.commit()
        
        return self.get_topic_by_id(topic_id)
    
    def get_topic_by_id(self, topic_id: str) -> Optional[Topic]:
        """Get topic by ID."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM topics WHERE id = ?", (topic_id,))
            row = cursor.fetchone()
            
            if row:
                return Topic(
                    id=row[0],
                    name=row[1],
                    description=row[2],
                    created_by=row[3],
                    document_count=row[4],
                    created_at=datetime.fromisoformat(row[5]),
                    updated_at=datetime.fromisoformat(row[6])
                )
        return None
    
    def get_all_topics(self) -> List[Topic]:
        """Get all topics."""
        topics = []
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM topics ORDER BY created_at DESC")
            rows = cursor.fetchall()
            
            for row in rows:
                topics.append(Topic(
                    id=row[0],
                    name=row[1],
                    description=row[2],
                    created_by=row[3],
                    document_count=row[4],
                    created_at=datetime.fromisoformat(row[5]),
                    updated_at=datetime.fromisoformat(row[6])
                ))
        
        return topics
    
    def update_topic(self, topic_id: str, name: str = None, description: str = None) -> Optional[Topic]:
        """Update topic information."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Build dynamic update query
            update_fields = []
            params = []
            
            if name is not None:
                update_fields.append("name = ?")
                params.append(name)
            
            if description is not None:
                update_fields.append("description = ?")
                params.append(description)
            
            if not update_fields:
                return self.get_topic_by_id(topic_id)
            
            update_fields.append("updated_at = ?")
            params.append(datetime.now().isoformat())
            params.append(topic_id)
            
            query = f"UPDATE topics SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)
            
            if cursor.rowcount > 0:
                return self.get_topic_by_id(topic_id)
        
        return None
    
    def delete_topic(self, topic_id: str) -> bool:
        """Delete a topic and all associated data."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            try:
                # Delete associated messages first
                cursor.execute("""
                    DELETE FROM messages 
                    WHERE session_id IN (
                        SELECT id FROM chat_sessions WHERE topic_id = ?
                    )
                """, (topic_id,))
                
                # Delete chat sessions
                cursor.execute("DELETE FROM chat_sessions WHERE topic_id = ?", (topic_id,))
                
                # Delete the topic
                cursor.execute("DELETE FROM topics WHERE id = ?", (topic_id,))
                
                conn.commit()
                return cursor.rowcount > 0
                
            except Exception as e:
                conn.rollback()
                raise e
    
    def increment_topic_document_count(self, topic_id: str) -> bool:
        """Increment document count for a topic."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE topics 
                    SET document_count = document_count + 1, updated_at = ? 
                    WHERE id = ?
                """, (datetime.utcnow(), topic_id))
                conn.commit()
                return cursor.rowcount > 0
        except Exception:
            return False
    
    # Chat session methods
    def create_chat_session(self, user_id: str, topic_id: str, title: str) -> ChatSession:
        """Create a new chat session."""
        session_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO chat_sessions (id, user_id, topic_id, title, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (session_id, user_id, topic_id, title, now))
            conn.commit()
        
        return self.get_chat_session_by_id(session_id)
    
    def get_chat_session_by_id(self, session_id: str) -> Optional[ChatSession]:
        """Get chat session by ID."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM chat_sessions WHERE id = ?", (session_id,))
            row = cursor.fetchone()
            
            if row:
                return ChatSession(
                    id=row[0],
                    user_id=row[1],
                    topic_id=row[2],
                    title=row[3],
                    created_at=datetime.fromisoformat(row[4])
                )
        return None
    
    def get_chat_sessions(self, user_id: str, topic_id: Optional[str] = None) -> List[ChatSession]:
        """Get chat sessions for a user, optionally filtered by topic."""
        sessions = []
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            if topic_id:
                cursor.execute("""
                    SELECT * FROM chat_sessions 
                    WHERE user_id = ? AND topic_id = ? 
                    ORDER BY created_at DESC
                """, (user_id, topic_id))
            else:
                cursor.execute("""
                    SELECT * FROM chat_sessions 
                    WHERE user_id = ? 
                    ORDER BY created_at DESC
                """, (user_id,))
            
            rows = cursor.fetchall()
            
            for row in rows:
                sessions.append(ChatSession(
                    id=row[0],
                    user_id=row[1],
                    topic_id=row[2],
                    title=row[3],
                    created_at=datetime.fromisoformat(row[4])
                ))
        
        return sessions
    
    # Message methods
    def save_message(self, session_id: str, sender: str, message: str, 
                    sources: Optional[List[str]] = None) -> Message:
        """Save a message to the database."""
        message_id = str(uuid.uuid4())
        now = datetime.utcnow()
        sources_json = json.dumps(sources) if sources else None
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO messages (id, session_id, sender, message, sources, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (message_id, session_id, sender, message, sources_json, now))
            conn.commit()
        
        return Message(
            id=message_id,
            session_id=session_id,
            sender=sender,
            message=message,
            sources=sources,
            created_at=now
        )
    
    def get_session_messages(self, session_id: str) -> List[Message]:
        """Get all messages for a session."""
        messages = []
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM messages 
                WHERE session_id = ? 
                ORDER BY created_at ASC
            """, (session_id,))
            rows = cursor.fetchall()
            
            for row in rows:
                sources = json.loads(row[4]) if row[4] else None
                messages.append(Message(
                    id=row[0],
                    session_id=row[1],
                    sender=row[2],
                    message=row[3],
                    sources=sources,
                    created_at=datetime.fromisoformat(row[5])
                ))
        
        return messages
    
    def get_system_stats(self) -> dict:
        """Get system statistics for admin dashboard."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Total users
            cursor.execute("SELECT COUNT(*) FROM users")
            total_users = cursor.fetchone()[0]
            
            # Total topics
            cursor.execute("SELECT COUNT(*) FROM topics")
            total_topics = cursor.fetchone()[0]
            
            # Total chat sessions
            cursor.execute("SELECT COUNT(*) FROM chat_sessions")
            total_sessions = cursor.fetchone()[0]
            
            # Total messages
            cursor.execute("SELECT COUNT(*) FROM messages")
            total_messages = cursor.fetchone()[0]
            
            # Users by role
            cursor.execute("""
                SELECT role, COUNT(*) 
                FROM users 
                GROUP BY role
            """)
            users_by_role = dict(cursor.fetchall())
            
            # Recent activity (last 7 days)
            seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
            
            cursor.execute("""
                SELECT COUNT(*) FROM users 
                WHERE created_at >= ?
            """, (seven_days_ago,))
            new_users_week = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT COUNT(*) FROM chat_sessions 
                WHERE created_at >= ?
            """, (seven_days_ago,))
            new_sessions_week = cursor.fetchone()[0]
            
            return {
                "total_users": total_users,
                "total_topics": total_topics,
                "total_sessions": total_sessions,
                "total_messages": total_messages,
                "users_by_role": users_by_role,
                "new_users_week": new_users_week,
                "new_sessions_week": new_sessions_week
            }
