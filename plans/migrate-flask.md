# 🚀 Migration Plan: Streamlit to Flask API Backend

## 📋 Overview

This plan outlines migrating the current Streamlit-based AI Virtual Assistant to a **Flask API backend** with a **React frontend**, maintaining all existing functionality while improving scalability and user experience.

## 🏗️ Project Structure (After Migration)

```
project/
├── backend/                    # Flask API Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── topic.py
│   │   │   ├── chat_session.py
│   │   │   └── message.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── document_loader.py
│   │   │   ├── vector_store.py
│   │   │   ├── qa_chain.py
│   │   │   └── database.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── topics.py
│   │   │   ├── chat.py
│   │   │   └── admin.py
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   └── cors.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── validators.py
│   │       ├── exceptions.py
│   │       └── helpers.py
│   ├── migrations/
│   ├── tests/
│   ├── uploads/                # PDF storage
│   ├── chroma_db/             # Vector store data
│   ├── app.py                 # Flask app entry point
│   ├── wsgi.py               # Production WSGI
│   ├── requirements.txt
│   ├── .env
│   └── README.md
├── frontend/                   # React Frontend (existing)
└── README.md
```

## 🔄 Migration Steps

### Phase 1: Backend Infrastructure Setup

#### 1.1 Create Flask Application Structure

````python
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import Config
from app.routes import auth_bp, topics_bp, chat_bp, admin_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    CORS(app)
    JWTManager(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(topics_bp, url_prefix='/api/topics')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    return app
````

#### 1.2 Configuration Management

````python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret'
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    DATABASE_URL = os.environ.get('DATABASE_URL') or 'sqlite:///assistant.db'
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(__file__), '..', 'chroma_db')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
````

### Phase 2: Migrate Core Services

#### 2.1 Database Models

````python
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class User:
    id: str
    name: str
    email: str
    password_hash: str
    role: str  # 'student' or 'admin'
    created_at: datetime
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat()
        }
````

````python
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

@dataclass
class Topic:
    id: str
    name: str
    description: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    document_count: int = 0
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'document_count': self.document_count
        }
````

#### 2.2 Migrate Document Processing Service

````python
import os
import uuid
from typing import List
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.schema import Document

class DocumentLoader:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = CharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
    
    def load_and_split_pdf(self, file_path: str) -> List[Document]:
        """Load PDF and split into chunks for embedding."""
        try:
            loader = PyPDFLoader(file_path)
            pages = loader.load()
            chunks = self.text_splitter.split_documents(pages)
            return chunks
        except Exception as e:
            raise Exception(f"Failed to process PDF: {str(e)}")
    
    def save_uploaded_file(self, file, upload_folder: str, topic_id: str) -> str:
        """Save uploaded file and return file path."""
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        file_id = str(uuid.uuid4())
        filename = f"{topic_id}_{file_id}_{file.filename}"
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        return file_path
````

#### 2.3 Migrate Vector Store Service

````python
import os
from typing import List, Optional
from langchain.vectorstores import Chroma
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.schema import Document

class VectorStoreService:
    def __init__(self, persist_directory: str):
        self.persist_directory = persist_directory
        self.embeddings = OpenAIEmbeddings()
    
    def create_topic_index(self, topic_id: str, documents: List[Document]) -> bool:
        """Create vector index for a specific topic."""
        try:
            topic_persist_dir = os.path.join(self.persist_directory, topic_id)
            
            vectorstore = Chroma.from_documents(
                documents=documents,
                embedding=self.embeddings,
                persist_directory=topic_persist_dir
            )
            vectorstore.persist()
            return True
        except Exception as e:
            raise Exception(f"Failed to create vector index: {str(e)}")
    
    def get_topic_retriever(self, topic_id: str):
        """Get retriever for a specific topic."""
        try:
            topic_persist_dir = os.path.join(self.persist_directory, topic_id)
            
            if not os.path.exists(topic_persist_dir):
                raise Exception(f"No index found for topic {topic_id}")
            
            vectorstore = Chroma(
                persist_directory=topic_persist_dir,
                embedding_function=self.embeddings
            )
            return vectorstore.as_retriever()
        except Exception as e:
            raise Exception(f"Failed to load retriever: {str(e)}")
    
    def delete_topic_index(self, topic_id: str) -> bool:
        """Delete vector index for a topic."""
        try:
            topic_persist_dir = os.path.join(self.persist_directory, topic_id)
            if os.path.exists(topic_persist_dir):
                import shutil
                shutil.rmtree(topic_persist_dir)
            return True
        except Exception as e:
            raise Exception(f"Failed to delete index: {str(e)}")
````

#### 2.4 Migrate QA Chain Service

````python
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate

class QAChainService:
    def __init__(self, model_name: str = "gpt-3.5-turbo", temperature: float = 0):
        self.llm = ChatOpenAI(model=model_name, temperature=temperature)
        self.prompt_template = PromptTemplate(
            template="""Use the following pieces of context to answer the question at the end. 
            If you don't know the answer, just say that you don't know, don't try to make up an answer.
            
            Context: {context}
            
            Question: {question}
            
            Answer: """,
            input_variables=["context", "question"]
        )
    
    def create_qa_chain(self, retriever):
        """Create QA chain with retriever."""
        return RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=retriever,
            chain_type_kwargs={"prompt": self.prompt_template},
            return_source_documents=True
        )
    
    def ask_question(self, qa_chain, question: str) -> dict:
        """Ask question and return answer with sources."""
        try:
            result = qa_chain({"query": question})
            
            sources = []
            if 'source_documents' in result:
                sources = [doc.page_content[:200] + "..." 
                          for doc in result['source_documents']]
            
            return {
                "answer": result['result'],
                "sources": sources
            }
        except Exception as e:
            raise Exception(f"Failed to generate answer: {str(e)}")
````

### Phase 3: Create API Endpoints

#### 3.1 Authentication Routes

````python
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
from app.services.database import DatabaseService

auth_bp = Blueprint('auth', __name__)
db_service = DatabaseService()

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate input
        if not all(k in data for k in ('name', 'email', 'password', 'role')):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if user exists
        if db_service.get_user_by_email(data['email']):
            return jsonify({'error': 'User already exists'}), 400
        
        # Create user
        user = db_service.create_user(
            name=data['name'],
            email=data['email'],
            password=data['password'],
            role=data['role']
        )
        
        # Generate token
        token = create_access_token(identity=user.id)
        
        return jsonify({
            'user': user.to_dict(),
            'token': token
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not all(k in data for k in ('email', 'password')):
            return jsonify({'error': 'Missing email or password'}), 400
        
        user = db_service.authenticate_user(data['email'], data['password'])
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        token = create_access_token(identity=user.id)
        
        return jsonify({
            'user': user.to_dict(),
            'token': token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user = db_service.get_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
````

#### 3.2 Topics Management Routes

````python
# filepath: backend/app/routes/topics.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.services.database import DatabaseService
from app.services.document_loader import DocumentLoader
from app.services.vector_store import VectorStoreService

topics_bp = Blueprint('topics', __name__)
db_service = DatabaseService()
doc_loader = DocumentLoader()

@topics_bp.route('', methods=['GET'])
@jwt_required()
def get_topics():
    try:
        topics = db_service.get_all_topics()
        return jsonify([topic.to_dict() for topic in topics]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@topics_bp.route('', methods=['POST'])
@jwt_required()
def create_topic():
    try:
        user_id = get_jwt_identity()
        user = db_service.get_user_by_id(user_id)
        
        if user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        if not all(k in data for k in ('name', 'description')):
            return jsonify({'error': 'Missing required fields'}), 400
        
        topic = db_service.create_topic(
            name=data['name'],
            description=data['description'],
            created_by=user_id
        )
        
        return jsonify(topic.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@topics_bp.route('/<topic_id>/documents', methods=['POST'])
@jwt_required()
def upload_document(topic_id):
    try:
        user_id = get_jwt_identity()
        user = db_service.get_user_by_id(user_id)
        
        if user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Save file
        file_path = doc_loader.save_uploaded_file(
            file, current_app.config['UPLOAD_FOLDER'], topic_id
        )
        
        # Process document
        chunks = doc_loader.load_and_split_pdf(file_path)
        
        # Create vector index
        vector_service = VectorStoreService(current_app.config['CHROMA_PERSIST_DIR'])
        vector_service.create_topic_index(topic_id, chunks)
        
        # Update topic document count
        db_service.increment_topic_document_count(topic_id)
        
        return jsonify({'message': 'Document uploaded and processed successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
````

#### 3.3 Chat Routes

````python
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.database import DatabaseService
from app.services.vector_store import VectorStoreService
from app.services.qa_chain import QAChainService

chat_bp = Blueprint('chat', __name__)
db_service = DatabaseService()
qa_service = QAChainService()

@chat_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_chat_sessions():
    try:
        user_id = get_jwt_identity()
        topic_id = request.args.get('topicId')
        
        sessions = db_service.get_chat_sessions(user_id, topic_id)
        return jsonify([session.to_dict() for session in sessions]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/sessions', methods=['POST'])
@jwt_required()
def create_chat_session():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not all(k in data for k in ('topicId', 'title')):
            return jsonify({'error': 'Missing required fields'}), 400
        
        session = db_service.create_chat_session(
            user_id=user_id,
            topic_id=data['topicId'],
            title=data['title']
        )
        
        return jsonify(session.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not all(k in data for k in ('sessionId', 'message')):
            return jsonify({'error': 'Missing required fields'}), 400
        
        session = db_service.get_chat_session_by_id(data['sessionId'])
        
        if not session or session.user_id != user_id:
            return jsonify({'error': 'Session not found'}), 404
        
        # Save user message
        user_message = db_service.save_message(
            session_id=session.id,
            sender='user',
            message=data['message']
        )
        
        # Get AI response
        vector_service = VectorStoreService(current_app.config['CHROMA_PERSIST_DIR'])
        retriever = vector_service.get_topic_retriever(session.topic_id)
        qa_chain = qa_service.create_qa_chain(retriever)
        
        result = qa_service.ask_question(qa_chain, data['message'])
        
        # Save AI response
        ai_message = db_service.save_message(
            session_id=session.id,
            sender='assistant',
            message=result['answer'],
            sources=result.get('sources', [])
        )
        
        return jsonify({
            'userMessage': user_message.to_dict(),
            'aiMessage': ai_message.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
````

### Phase 4: Database Service Implementation

````python
import sqlite3
import uuid
from datetime import datetime
from typing import List, Optional
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.user import User
from app.models.topic import Topic
from app.models.chat_session import ChatSession
from app.models.message import Message

class DatabaseService:
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
                    role TEXT NOT NULL,
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
                    sender TEXT NOT NULL,
                    message TEXT NOT NULL,
                    sources TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
                )
            """)
            
            conn.commit()
    
    def create_user(self, name: str, email: str, password: str, role: str) -> User:
        """Create a new user."""
        user_id = str(uuid.uuid4())
        password_hash = generate_password_hash(password)
        
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
    
    # ... Additional methods for topics, chat sessions, and messages
````

### Phase 5: Frontend Integration

#### 5.1 Update Frontend Services

````typescript
import axios, { AxiosResponse } from "axios";
import type { AuthCredentials, AuthResponse, User } from "@/types/auth";
import type { Topic, ChatSession, ChatMessage } from "@/types/topic";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth Service
export const authService = {
  login: async (credentials: AuthCredentials): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await apiClient.post(
      "/auth/login",
      credentials
    );
    return response.data;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await apiClient.post(
      "/auth/register",
      userData
    );
    return response.data;
  },
};

// Topic Service
export const topicService = {
  getTopics: async (): Promise<Topic[]> => {
    const response: AxiosResponse<Topic[]> = await apiClient.get("/topics");
    return response.data;
  },

  createTopic: async (topicData: CreateTopicData): Promise<Topic> => {
    const response: AxiosResponse<Topic> = await apiClient.post("/topics", topicData);
    return response.data;
  },

  uploadDocument: async (topicId: string, file: File): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response: AxiosResponse<{ message: string }> = await apiClient.post(
      `/topics/${topicId}/documents`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },
};

// Chat Service
export const chatService = {
  getChatSessions: async (topicId: string): Promise<ChatSession[]> => {
    const response: AxiosResponse<ChatSession[]> = await apiClient.get(
      `/chat/sessions?topicId=${topicId}`
    );
    return response.data;
  },

  sendMessage: async (sessionId: string, message: string): Promise<any> => {
    const response = await apiClient.post("/chat/message", {
      sessionId,
      message,
    });
    return response.data;
  },

  createSession: async (topicId: string, title: string): Promise<ChatSession> => {
    const response: AxiosResponse<ChatSession> = await apiClient.post("/chat/sessions", {
      topicId,
      title,
    });
    return response.data;
  },
};
````

### Phase 6: Deployment Setup

#### 6.1 Flask App Entry Point

````python
from app import create_app
import os

app = create_app()

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=os.environ.get('FLASK_ENV') == 'development'
    )
````

#### 6.2 Requirements File

````text
Flask==2.3.3
Flask-CORS==4.0.0
Flask-JWT-Extended==4.5.3
python-dotenv==1.0.0
langchain==0.1.0
openai>=1.10.0
chromadb>=0.4.24
pypdf>=3.15.0
Werkzeug==2.3.7
gunicorn==21.2.0
````

#### 6.3 Environment Configuration

````bash
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
OPENAI_API_KEY=your-openai-api-key
DATABASE_URL=sqlite:///assistant.db
FLASK_ENV=development
PORT=5000
````

## 🚀 Migration Timeline

### Week 1: Backend Foundation
- [ ] Set up Flask project structure
- [ ] Implement database models and services
- [ ] Create authentication system
- [ ] Migrate core LangChain services

### Week 2: API Development
- [ ] Implement topic management endpoints
- [ ] Create chat and messaging APIs
- [ ] Add file upload and processing
- [ ] Implement error handling and validation

### Week 3: Frontend Integration
- [ ] Update frontend API services
- [ ] Test API integration
- [ ] Implement real-time features (if needed)
- [ ] Add loading states and error handling

### Week 4: Testing & Deployment
- [ ] Write comprehensive tests
- [ ] Set up production environment
- [ ] Performance optimization
- [ ] Documentation and deployment

## 🔧 Development Commands

````bash
# Backend Development
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python app.py

# Frontend Development (existing)
cd frontend
npm install
npm run dev

# Production Build
cd backend
gunicorn --bind 0.0.0.0:5000 app:app

cd frontend
npm run build
````

## ✅ Benefits of Migration

1. **Scalability**: Separate backend allows for better resource management
2. **Flexibility**: Multiple frontends can consume the same API
3. **Performance**: Better caching and optimization opportunities
4. **Security**: Proper authentication and authorization
5. **Maintainability**: Clear separation of concerns
6. **Testing**: Easier to test backend logic independently

This migration plan maintains all existing functionality while providing a robust, scalable foundation for future enhancements.

Similar code found with 2 license types