## 📋 **Implementation Plan: Multi-User Topic-Based AI Assistant**

### **Current State Analysis**
Your existing codebase has:
- Single PDF upload and processing via ui.py
- Document loading with `load_and_split_pdf`
- Vector storage with `create_vector_store` 
- QA chain with `build_qa_chain`
- Basic Streamlit interface

### **Phase 1: Database Foundation (Days 1-2)**

#### 1.1 Create Database Schema Module
Create `app/database.py`:

````python
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
    # Implementation details...

def authenticate_user(username: str, password: str, db_path: str = "assistant.db") -> Optional[Dict]:
    """Authenticate user and return user info."""
    # Implementation details...

def create_topic(name: str, description: str, created_by: int, db_path: str = "assistant.db") -> int:
    """Create a new topic and return topic ID."""
    # Implementation details...

def get_all_topics(db_path: str = "assistant.db") -> List[Dict]:
    """Get all available topics."""
    # Implementation details...

def create_chat_session(user_id: int, topic_id: int, db_path: str = "assistant.db") -> int:
    """Create a new chat session."""
    # Implementation details...

def log_chat_message(session_id: int, sender: str, message: str, db_path: str = "assistant.db"):
    """Log a message in the chat session."""
    # Implementation details...

def get_chat_history(session_id: int, db_path: str = "assistant.db") -> List[Dict]:
    """Get chat history for a session."""
    # Implementation details...
````

#### 1.2 Update Configuration
Modify config.py:

````python
"""
Configuration module for the AI Virtual Assistant.
Handles loading of environment variables and database setup.
"""
from dotenv import load_dotenv
import os
from app.database import setup_sqlite_database

# Load environment variables from .env file
load_dotenv()

# Make API key available for OpenAI and LangChain
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

# Database configuration
DATABASE_PATH = "assistant.db"
TOPICS_STORAGE_DIR = "topics_storage"
VECTOR_STORE_BASE_DIR = "vector_stores"

# Initialize database on module import
setup_sqlite_database(DATABASE_PATH)

# Ensure storage directories exist
os.makedirs(TOPICS_STORAGE_DIR, exist_ok=True)
os.makedirs(VECTOR_STORE_BASE_DIR, exist_ok=True)
````

### **Phase 2: Enhanced Vector Store (Days 3-4)**

#### 2.1 Update Vector Store for Topic-Based Storage
Modify vector_store.py:

````python
"""
Enhanced vector store module for topic-based document storage.
"""
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings.openai import OpenAIEmbeddings
import os
import shutil

def create_chroma_index_for_topic(topic_id: str, chunks: list, persist_directory: str = None):
    """
    Creates and stores embeddings for a topic's study material using Chroma.
    Persists embeddings to a topic-specific directory.
    """
    if persist_directory is None:
        from app.config import VECTOR_STORE_BASE_DIR
        persist_directory = os.path.join(VECTOR_STORE_BASE_DIR, f"topic_{topic_id}")
    
    # Clean up existing directory if it exists
    if os.path.exists(persist_directory):
        shutil.rmtree(persist_directory)
    
    os.makedirs(persist_directory, exist_ok=True)
    
    embeddings = OpenAIEmbeddings()
    
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=persist_directory
    )
    
    vectorstore.persist()
    return persist_directory

def load_retriever_for_topic(topic_id: str, persist_directory: str = None):
    """
    Loads a retriever from the Chroma vector store for the given topic.
    """
    if persist_directory is None:
        from app.config import VECTOR_STORE_BASE_DIR
        persist_directory = os.path.join(VECTOR_STORE_BASE_DIR, f"topic_{topic_id}")
    
    if not os.path.exists(persist_directory):
        raise FileNotFoundError(f"Vector store for topic {topic_id} not found")
    
    embeddings = OpenAIEmbeddings()
    vectorstore = Chroma(
        persist_directory=persist_directory,
        embedding_function=embeddings
    )
    
    return vectorstore.as_retriever(search_kwargs={"k": 4})
````

### **Phase 3: Authentication System (Days 5-6)**

#### 3.1 Create Authentication Module
Create `app/auth.py`:

````python
import streamlit as st
import hashlib
from app.database import authenticate_user, create_user

def hash_password(password: str) -> str:
    """Hash password using SHA256."""
    return hashlib.sha256(password.encode()).hexdigest()

def login_form():
    """Display login form and handle authentication."""
    with st.form("login_form"):
        st.subheader("🔐 Login")
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")
        submitted = st.form_submit_button("Login")
        
        if submitted:
            user = authenticate_user(username, password)
            if user:
                st.session_state.user = user
                st.success(f"Welcome {user['username']}!")
                st.rerun()
            else:
                st.error("Invalid credentials")

def signup_form():
    """Display signup form for new students."""
    with st.form("signup_form"):
        st.subheader("📝 Student Registration")
        username = st.text_input("Choose Username")
        password = st.text_input("Password", type="password")
        confirm_password = st.text_input("Confirm Password", type="password")
        submitted = st.form_submit_button("Register")
        
        if submitted:
            if password != confirm_password:
                st.error("Passwords don't match")
            elif len(password) < 6:
                st.error("Password must be at least 6 characters")
            elif create_user(username, password, "student"):
                st.success("Account created! Please login.")
            else:
                st.error("Username already exists")

def logout():
    """Clear session state and logout user."""
    st.session_state.clear()
    st.rerun()

def require_auth(role=None):
    """Decorator/function to require authentication."""
    if 'user' not in st.session_state:
        return False
    if role and st.session_state.user['role'] != role:
        return False
    return True
````

### **Phase 4: Admin Interface (Days 7-8)**

#### 4.1 Create Admin UI Module
Create `app/admin_ui.py`:

````python
import streamlit as st
import tempfile
import os
from app.database import create_topic, get_all_topics
from app.document_loader import load_and_split_pdf
from app.vector_store import create_chroma_index_for_topic
from app.config import TOPICS_STORAGE_DIR

def admin_topic_upload_ui():
    """
    Streamlit UI for admins to:
    - Enter topic metadata
    - Upload a PDF
    - Trigger indexing and persistence
    """
    st.header("📚 Admin: Topic Management")
    
    # Display existing topics
    topics = get_all_topics()
    if topics:
        st.subheader("Existing Topics")
        for topic in topics:
            with st.expander(f"📖 {topic['name']}"):
                st.write(f"**Description:** {topic['description']}")
                st.write(f"**Created:** {topic['created_at']}")
                if topic['pdf_filename']:
                    st.write(f"**PDF:** {topic['pdf_filename']}")
    
    st.divider()
    
    # Create new topic form
    st.subheader("➕ Create New Topic")
    
    with st.form("create_topic_form"):
        topic_name = st.text_input("Topic Name*", placeholder="e.g., Introduction to Machine Learning")
        topic_description = st.text_area("Description", placeholder="Brief description of the topic...")
        uploaded_file = st.file_uploader("Upload Study Material (PDF)*", type=["pdf"])
        
        submitted = st.form_submit_button("Create Topic")
        
        if submitted:
            if not topic_name or not uploaded_file:
                st.error("Please provide both topic name and PDF file")
            else:
                with st.spinner("Creating topic and processing document..."):
                    try:
                        # Create topic in database
                        topic_id = create_topic(
                            name=topic_name,
                            description=topic_description,
                            created_by=st.session_state.user['id']
                        )
                        
                        # Save PDF file
                        pdf_filename = f"topic_{topic_id}_{uploaded_file.name}"
                        pdf_path = os.path.join(TOPICS_STORAGE_DIR, pdf_filename)
                        
                        with open(pdf_path, "wb") as f:
                            f.write(uploaded_file.getvalue())
                        
                        # Process document and create vector store
                        chunks = load_and_split_pdf(pdf_path)
                        vector_store_path = create_chroma_index_for_topic(str(topic_id), chunks)
                        
                        # Update topic with file paths
                        # Add database update function here
                        
                        st.success(f"Topic '{topic_name}' created successfully!")
                        st.rerun()
                        
                    except Exception as e:
                        st.error(f"Error creating topic: {str(e)}")
````

### **Phase 5: Student Interface (Days 9-10)**

#### 5.1 Create Student UI Module
Create `app/student_ui.py`:

````python
import streamlit as st
from app.database import get_all_topics, create_chat_session, log_chat_message, get_chat_history
from app.vector_store import load_retriever_for_topic
from app.qa_chain import build_qa_chain

def student_qa_ui():
    """
    Streamlit UI for students to:
    - Log in / select topic
    - Ask questions
    - Receive intelligent responses
    - View session history
    """
    st.header("🎓 Student: Learning Assistant")
    
    # Topic selection
    topics = get_all_topics()
    if not topics:
        st.info("No topics available yet. Please contact your instructor.")
        return
    
    # Sidebar for topic selection and session management
    with st.sidebar:
        st.subheader("📚 Select Topic")
        
        topic_options = {f"{topic['name']}": topic for topic in topics}
        selected_topic_name = st.selectbox("Choose a topic:", list(topic_options.keys()))
        selected_topic = topic_options[selected_topic_name]
        
        st.write(f"**Description:** {selected_topic['description']}")
        
        # Session management
        if st.button("Start New Session"):
            session_id = create_chat_session(
                user_id=st.session_state.user['id'],
                topic_id=selected_topic['id']
            )
            st.session_state.current_session = session_id
            st.session_state.chat_history = []
            st.rerun()
    
    # Main chat interface
    if 'current_session' in st.session_state:
        st.subheader(f"💬 Chat: {selected_topic['name']}")
        
        # Load QA chain for selected topic
        if 'qa_chain' not in st.session_state or st.session_state.get('current_topic_id') != selected_topic['id']:
            try:
                with st.spinner("Loading topic materials..."):
                    retriever = load_retriever_for_topic(str(selected_topic['id']))
                    st.session_state.qa_chain = build_qa_chain(retriever)
                    st.session_state.current_topic_id = selected_topic['id']
            except Exception as e:
                st.error(f"Error loading topic: {str(e)}")
                return
        
        # Display chat history
        if 'chat_history' not in st.session_state:
            st.session_state.chat_history = get_chat_history(st.session_state.current_session)
        
        # Chat container
        chat_container = st.container()
        with chat_container:
            for message in st.session_state.chat_history:
                if message['sender'] == 'user':
                    st.chat_message("user").write(message['message'])
                else:
                    st.chat_message("assistant").write(message['message'])
        
        # Question input
        if prompt := st.chat_input("Ask a question about the topic..."):
            # Display user message
            st.chat_message("user").write(prompt)
            
            # Get AI response
            with st.spinner("Thinking..."):
                try:
                    response = st.session_state.qa_chain.run(prompt)
                    
                    # Display assistant response
                    st.chat_message("assistant").write(response)
                    
                    # Log messages to database
                    log_chat_message(st.session_state.current_session, "user", prompt)
                    log_chat_message(st.session_state.current_session, "assistant", response)
                    
                    # Update session state
                    st.session_state.chat_history.append({"sender": "user", "message": prompt})
                    st.session_state.chat_history.append({"sender": "assistant", "message": response})
                    
                except Exception as e:
                    st.error(f"Error getting response: {str(e)}")
    
    else:
        st.info("Click 'Start New Session' to begin chatting about the selected topic.")
````

### **Phase 6: Main UI Integration (Days 11-12)**

#### 6.1 Update Main UI
Completely rewrite ui.py:

````python
"""
Main Streamlit UI module for the AI Virtual Assistant.
Handles authentication and routes to appropriate interfaces.
"""
import streamlit as st
from app.auth import login_form, signup_form, logout, require_auth
from app.admin_ui import admin_topic_upload_ui
from app.student_ui import student_qa_ui

def run_ui():
    """
    Main UI controller that handles authentication and role-based routing.
    """
    st.set_page_config(
        page_title="AI Study Assistant", 
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Header
    st.title("📘 AI Virtual Assistant for Students")
    st.markdown("---")
    
    # Check authentication
    if not require_auth():
        # Show login/signup interface
        col1, col2 = st.columns(2)
        
        with col1:
            login_form()
        
        with col2:
            signup_form()
            
        st.info("👆 Please login or register to continue")
        return
    
    # Authenticated user interface
    user = st.session_state.user
    
    # Sidebar with user info and logout
    with st.sidebar:
        st.subheader(f"👤 Welcome, {user['username']}")
        st.write(f"**Role:** {user['role'].title()}")
        
        if st.button("🚪 Logout"):
            logout()
        
        st.divider()
    
    # Route to appropriate interface based on role
    if user['role'] == 'admin':
        admin_topic_upload_ui()
    elif user['role'] == 'student':
        student_qa_ui()
    else:
        st.error("Unknown user role")
````

### **Phase 7: Testing & Refinement (Days 13-14)**

#### 7.1 Create Test Data
Update create_sample_pdf.py to create multiple sample PDFs for different topics.

#### 7.2 Update Requirements
Update requirements.txt:

````txt
langchain>=0.1.0
openai>=1.10.0
chromadb>=0.4.22
pypdf>=3.15.0
streamlit>=1.30.0
python-dotenv>=1.0.0
reportlab>=4.0.0
````

#### 7.3 Update Gitignore
Update .gitignore:

````
# ...existing code...

# Database files
assistant.db
*.db

# Topic storage
topics_storage/
vector_stores/

# Session data
sessions/
````

### **Implementation Timeline Summary**

| Phase       | Days  | Key Deliverables                   |
| ----------- | ----- | ---------------------------------- |
| **Phase 1** | 1-2   | Database schema, user management   |
| **Phase 2** | 3-4   | Topic-based vector storage         |
| **Phase 3** | 5-6   | Authentication system              |
| **Phase 4** | 7-8   | Admin interface for topic creation |
| **Phase 5** | 9-10  | Student chat interface             |
| **Phase 6** | 11-12 | Integration and routing            |
| **Phase 7** | 13-14 | Testing and refinement             |

### **Key Features After Implementation**
- ✅ Multi-user authentication (admin/student roles)
- ✅ Topic-based document management
- ✅ Persistent chat sessions with history
- ✅ Admin portal for content management
- ✅ Student interface for topic selection and Q&A
- ✅ SQLite database for data persistence

This plan transforms your single-user PDF Q&A system into a full-featured educational platform while maintaining the core LangChain + ChromaDB + OpenAI architecture.