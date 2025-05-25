"""
Database module for the AI Virtual Assistant.
Handles SQLite database operations for multi-user system.
"""
import sqlite3
import hashlib
from datetime import datetime
from typing import List, Dict, Optional


def setup_sqlite_database(db_path: str = "assistant.db"):
    """
    Sets up SQLite database tables for multi-user system.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Topics table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        pdf_filename TEXT,
        vector_store_path TEXT,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
    )
    ''')
    
    # Chat sessions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        topic_id INTEGER NOT NULL,
        session_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (topic_id) REFERENCES topics (id)
    )
    ''')
    
    # Messages table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
        message TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
    )
    ''')
    
    # Create default admin user
    cursor.execute('''
    INSERT OR IGNORE INTO users (username, password_hash, role) 
    VALUES (?, ?, ?)
    ''', ('admin', hashlib.sha256('admin123'.encode()).hexdigest(), 'admin'))
    
    conn.commit()
    conn.close()


def create_user(username: str, password: str, role: str, db_path: str = "assistant.db") -> bool:
    """Create a new user account."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        cursor.execute('''
        INSERT INTO users (username, password_hash, role) 
        VALUES (?, ?, ?)
        ''', (username, password_hash, role))
        
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        # Username already exists
        return False
    except Exception:
        return False


def authenticate_user(username: str, password: str, db_path: str = "assistant.db") -> Optional[Dict]:
    """Authenticate user and return user info."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        cursor.execute('''
        SELECT id, username, role, created_at 
        FROM users 
        WHERE username = ? AND password_hash = ?
        ''', (username, password_hash))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                'id': result[0],
                'username': result[1],
                'role': result[2],
                'created_at': result[3]
            }
        return None
    except Exception:
        return None


def create_topic(name: str, description: str, created_by: int, db_path: str = "assistant.db") -> int:
    """Create a new topic and return topic ID."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
    INSERT INTO topics (name, description, created_by) 
    VALUES (?, ?, ?)
    ''', (name, description, created_by))
    
    topic_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return topic_id


def update_topic_files(topic_id: int, pdf_filename: str, vector_store_path: str, db_path: str = "assistant.db"):
    """Update topic with file paths after processing."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
    UPDATE topics 
    SET pdf_filename = ?, vector_store_path = ? 
    WHERE id = ?
    ''', (pdf_filename, vector_store_path, topic_id))
    
    conn.commit()
    conn.close()


def get_all_topics(db_path: str = "assistant.db") -> List[Dict]:
    """Get all available topics."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
    SELECT id, name, description, pdf_filename, vector_store_path, created_by, created_at 
    FROM topics 
    ORDER BY created_at DESC
    ''')
    
    results = cursor.fetchall()
    conn.close()
    
    topics = []
    for result in results:
        topics.append({
            'id': result[0],
            'name': result[1],
            'description': result[2],
            'pdf_filename': result[3],
            'vector_store_path': result[4],
            'created_by': result[5],
            'created_at': result[6]
        })
    
    return topics


def create_chat_session(user_id: int, topic_id: int, session_name: str = None, db_path: str = "assistant.db") -> int:
    """Create a new chat session."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    if session_name is None:
        session_name = f"Session {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    
    cursor.execute('''
    INSERT INTO chat_sessions (user_id, topic_id, session_name) 
    VALUES (?, ?, ?)
    ''', (user_id, topic_id, session_name))
    
    session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return session_id


def log_chat_message(session_id: int, sender: str, message: str, db_path: str = "assistant.db"):
    """Log a message in the chat session."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
    INSERT INTO messages (session_id, sender, message) 
    VALUES (?, ?, ?)
    ''', (session_id, sender, message))
    
    conn.commit()
    conn.close()


def get_chat_history(session_id: int, db_path: str = "assistant.db") -> List[Dict]:
    """Get chat history for a session."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
    SELECT sender, message, timestamp 
    FROM messages 
    WHERE session_id = ? 
    ORDER BY timestamp ASC
    ''', (session_id,))
    
    results = cursor.fetchall()
    conn.close()
    
    messages = []
    for result in results:
        messages.append({
            'sender': result[0],
            'message': result[1],
            'timestamp': result[2]
        })
    
    return messages


def get_user_sessions(user_id: int, topic_id: int = None, db_path: str = "assistant.db") -> List[Dict]:
    """Get all chat sessions for a user, optionally filtered by topic."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    if topic_id:
        cursor.execute('''
        SELECT cs.id, cs.session_name, cs.created_at, t.name as topic_name
        FROM chat_sessions cs
        JOIN topics t ON cs.topic_id = t.id
        WHERE cs.user_id = ? AND cs.topic_id = ?
        ORDER BY cs.created_at DESC
        ''', (user_id, topic_id))
    else:
        cursor.execute('''
        SELECT cs.id, cs.session_name, cs.created_at, t.name as topic_name
        FROM chat_sessions cs
        JOIN topics t ON cs.topic_id = t.id
        WHERE cs.user_id = ?
        ORDER BY cs.created_at DESC
        ''', (user_id,))
    
    results = cursor.fetchall()
    conn.close()
    
    sessions = []
    for result in results:
        sessions.append({
            'id': result[0],
            'session_name': result[1],
            'created_at': result[2],
            'topic_name': result[3]
        })
    
    return sessions
