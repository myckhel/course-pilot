# AI Virtual Assistant for Student Q&A - Project Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [System Architecture & Flow](#2-system-architecture--flow)
3. [Entity Relationship Diagram (ERD)](#3-entity-relationship-diagram-erd)
4. [User Flow](#4-user-flow)
5. [Development Stack](#5-development-stack)
6. [Programming Languages & Frameworks](#6-programming-languages--frameworks)
7. [APIs and Services](#7-apis-and-services)
8. [Frontend Components](#8-frontend-components)
9. [State Management](#9-state-management)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [AI Layer](#11-ai-layer)
12. [Tools & Libraries](#12-tools--libraries)
13. [Deployment & Environment Setup](#13-deployment--environment-setup)
14. [Future Enhancements / TODOs](#14-future-enhancements--todos)

---

## 1. Project Overview

### Purpose
The **AI Virtual Assistant for Student Q&A** is a lightweight, AI-powered educational platform designed to enhance the learning experience of students in higher education. The system enables students to ask questions in natural language based on uploaded study materials (PDFs) and receive intelligent, context-aware answers sourced directly from the selected topic materials.

### Target Users
- **Students**: Primary users who interact with the system to ask questions and receive AI-generated answers
- **Administrators**: Educators or content managers who upload and manage study topics and documents

### Core Features
- **Topic Management**: Create and organize study topics with associated documents
- **Document Processing**: Upload and process PDF documents using advanced text chunking and embedding
- **AI-Powered Q&A**: Contextual question answering using Retrieval-Augmented Generation (RAG)
- **Chat Sessions**: Persistent conversation history for continuous learning
- **User Management**: Role-based access control for students and administrators
- **Document Deduplication**: Prevents duplicate content in the vector store
- **Real-time Analytics**: Dashboard insights for administrators

### Business Value
- Provides 24/7 availability for student queries
- Enhances comprehension through interactive learning
- Reduces instructor workload for repetitive questions
- Supports flipped classroom and self-directed learning models
- Demonstrates practical application of modern AI technologies in education

---

## 2. System Architecture & Flow

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (React)       │◄──►│   (Flask)       │◄──►│   (OpenAI)      │
│                 │    │                 │    │                 │
│ • Student UI    │    │ • REST API      │    │ • GPT Models    │
│ • Admin Panel   │    │ • Auth Service  │    │ • Embeddings    │
│ • Chat Interface│    │ • Document Proc │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   Database      │              │
         │              │   (SQLite)      │              │
         │              │                 │              │
         │              │ • Users         │              │
         │              │ • Topics        │              │
         │              │ • Documents     │              │
         │              │ • Chat Sessions │              │
         │              │ • Messages      │              │
         │              └─────────────────┘              │
         │                                               │
         └──────────────────────────────────────────────────┐
                                 │                          │
                                 ▼                          ▼
                        ┌─────────────────┐       ┌─────────────────┐
                        │  Vector Store   │       │  File Storage   │
                        │  (ChromaDB)     │       │  (Local/Cloud)  │
                        │                 │       │                 │
                        │ • Document      │       │ • PDF Files     │
                        │   Embeddings    │       │ • Uploads       │
                        │ • Semantic      │       │ • Logs          │
                        │   Search        │       │                 │
                        └─────────────────┘       └─────────────────┘
```

### Component Interaction Flow

1. **Authentication Flow**:
   - User logs in through React frontend
   - Credentials validated against SQLite database
   - JWT token issued and stored for session management

2. **Document Upload Flow** (Admin):
   - Admin uploads PDF through frontend
   - Backend processes document using LangChain
   - Text chunked and embedded using OpenAI
   - Vectors stored in ChromaDB with topic association
   - Document metadata saved in SQLite

3. **Question-Answer Flow** (Student):
   - Student selects topic and asks question
   - Question embedded using OpenAI
   - Semantic search performed in ChromaDB
   - Relevant context retrieved and sent to GPT
   - AI response generated and returned to frontend
   - Conversation saved in chat session

---

## 3. Entity Relationship Diagram (ERD)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      User       │     │      Topic      │     │    Document     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │────►│ id (PK)         │◄────│ id (PK)         │
│ name            │     │ title           │     │ title           │
│ email (unique)  │     │ description     │     │ filename        │
│ password_hash   │     │ creator_id (FK) │     │ file_path       │
│ role            │     │ created_at      │     │ file_size       │
│ created_at      │     │ updated_at      │     │ file_hash       │
└─────────────────┘     │ is_active       │     │ topic_id (FK)   │
         │               └─────────────────┘     │ uploader_id(FK) │
         │                        │              │ created_at      │
         │                        │              │ processed_at    │
         │                        │              │ chunk_count     │
         │                        │              └─────────────────┘
         │                        │
         │               ┌─────────────────┐
         │               │  ChatSession    │
         │               ├─────────────────┤
         └──────────────►│ id (PK)         │
                         │ user_id (FK)    │
                         │ topic_id (FK)   │
                         │ title           │
                         │ created_at      │
                         │ updated_at      │
                         │ is_active       │
                         └─────────────────┘
                                  │
                                  │
                         ┌─────────────────┐
                         │    Message      │
                         ├─────────────────┤
                         │ id (PK)         │
                         │ session_id (FK) │
                         │ content         │
                         │ role            │
                         │ timestamp       │
                         │ tokens_used     │
                         └─────────────────┘
```

### Relationships
- **User** → **Topic**: One-to-Many (creator relationship)
- **User** → **ChatSession**: One-to-Many
- **User** → **Document**: One-to-Many (uploader relationship)
- **Topic** → **Document**: One-to-Many
- **Topic** → **ChatSession**: One-to-Many
- **ChatSession** → **Message**: One-to-Many

---

## 4. User Flow

### Student User Journey

```
Login/Register → Topic Selection → Chat Interface → Ask Questions → Receive AI Answers → Session History
```

**Detailed Steps:**
1. **Authentication**
   - Student visits application
   - Logs in with email/password or registers new account
   - Redirected to dashboard upon successful authentication

2. **Topic Selection**
   - Views available study topics
   - Selects relevant topic based on study needs
   - Can preview topic description and document count

3. **Chat Interaction**
   - Creates new chat session or continues existing one
   - Types natural language questions related to topic
   - Receives contextual AI-generated answers
   - Can ask follow-up questions in same session

4. **Session Management**
   - Views chat history across sessions
   - Can rename or delete sessions
   - Access previous conversations for review

### Admin User Journey

```
Login → Admin Dashboard → Topic Management → Document Upload → Analytics Review
```

**Detailed Steps:**
1. **Authentication & Dashboard**
   - Admin logs in with elevated privileges
   - Views system overview with key metrics
   - Monitors user activity and system health

2. **Topic Management**
   - Creates new study topics with descriptions
   - Manages existing topics (edit, delete, activate/deactivate)
   - Associates topics with specific courses or subjects

3. **Document Processing**
   - Uploads PDF documents to topics
   - Monitors document processing status
   - Reviews document chunking and embedding results
   - Handles duplicate document detection

4. **Analytics & Monitoring**
   - Reviews user engagement metrics
   - Monitors AI response quality
   - Tracks system performance and usage patterns

---

## 5. Development Stack

### Technology Selection Rationale

**Frontend Stack:**
- **React 19**: Latest stable version with improved performance and developer experience
- **TypeScript**: Type safety and better IDE support for large-scale development
- **Vite**: Fast build tool with hot module replacement for development efficiency
- **Ant Design**: Professional UI component library with comprehensive design system
- **Tailwind CSS**: Utility-first CSS framework for rapid custom styling

**Backend Stack:**
- **Flask 3.0**: Lightweight Python web framework suitable for API development
- **SQLite**: File-based database perfect for development and small-scale deployment
- **LangChain**: Framework for building applications with large language models
- **ChromaDB**: Vector database optimized for similarity search and embeddings

**AI & ML Stack:**
- **OpenAI GPT**: State-of-the-art language models for question answering
- **OpenAI Embeddings**: High-quality text embeddings for semantic search
- **PyPDF**: Python library for PDF text extraction and processing

---

## 6. Programming Languages & Frameworks

### Backend (Python)
- **Language**: Python 3.9+
- **Web Framework**: Flask 3.0
- **ORM**: SQLAlchemy 2.0
- **Authentication**: Flask-JWT-Extended
- **Database**: SQLite3 (built-in)
- **AI Framework**: LangChain
- **Document Processing**: PyPDF, python-docx, unstructured

### Frontend (TypeScript/JavaScript)
- **Language**: TypeScript 5.8
- **Framework**: React 19
- **Build Tool**: Vite 6.3
- **Router**: React Router DOM v7
- **HTTP Client**: Axios
- **State Management**: Zustand with persistence

### Configuration & DevOps
- **Environment**: python-dotenv, environment variables
- **Testing**: pytest (backend), Jest/React Testing Library (frontend)
- **Code Quality**: Black, Flake8, ESLint, Prettier
- **Database Migration**: Flask-Migrate
- **WSGI Server**: Gunicorn (production)

---

## 7. APIs and Services

### Internal API Endpoints

#### Authentication Endpoints
```
POST   /api/auth/register    - User registration
POST   /api/auth/login       - User authentication
POST   /api/auth/refresh     - Token refresh
DELETE /api/auth/logout      - User logout
GET    /api/auth/me          - Current user profile
```

#### Topic Management
```
GET    /api/topics           - List all topics
POST   /api/topics           - Create new topic (admin)
GET    /api/topics/{id}      - Get topic details
PUT    /api/topics/{id}      - Update topic (admin)
DELETE /api/topics/{id}      - Delete topic (admin)
```

#### Document Management
```
GET    /api/topics/{id}/documents        - List topic documents
POST   /api/topics/{id}/documents        - Upload document (admin)
DELETE /api/documents/{id}               - Delete document (admin)
GET    /api/documents/{id}/status        - Processing status
```

#### Chat & Messaging
```
GET    /api/chat/sessions                - List user's chat sessions
POST   /api/chat/sessions                - Create new chat session
GET    /api/chat/sessions/{id}           - Get session details
DELETE /api/chat/sessions/{id}           - Delete session
GET    /api/chat/sessions/{id}/messages  - Get session messages
POST   /api/chat/message                 - Send message/question
```

#### Admin & Analytics
```
GET    /api/admin/dashboard              - Admin dashboard stats
GET    /api/admin/users                  - List all users
GET    /api/admin/analytics              - System analytics
```

#### System Health
```
GET    /api/health                       - Health check endpoint
```

### External Services

#### OpenAI API Integration
- **Service**: OpenAI GPT-3.5/GPT-4
- **Purpose**: Text generation and embeddings
- **Authentication**: API key-based
- **Rate Limits**: Configured per OpenAI tier
- **Error Handling**: Retry logic with exponential backoff

#### Vector Database (ChromaDB)
- **Service**: Local ChromaDB instance
- **Purpose**: Semantic search and document retrieval
- **Collections**: Organized by topic ID
- **Indexing**: Automatic embedding indexing

---

## 8. Frontend Components

### Component Architecture

```
src/
├── components/
│   ├── common/                 # Reusable UI components
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── Loading/
│   │   └── ErrorBoundary/
│   ├── layout/                 # Layout components
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── Footer/
│   │   └── MainLayout/
│   └── features/               # Feature-specific components
│       ├── auth/
│       ├── topics/
│       ├── chat/
│       └── admin/
```

### Key Component Categories

#### Layout Components
- **MainLayout**: Root layout wrapper with navigation
- **Header**: Top navigation with user menu and notifications
- **Sidebar**: Navigation menu for different sections
- **Footer**: Application footer with links and info

#### Authentication Components
- **LoginForm**: User login with validation
- **RegisterForm**: New user registration
- **ProtectedRoute**: Route wrapper for authenticated users
- **RoleGuard**: Component-level authorization

#### Topic Management Components
- **TopicList**: Display available topics with search/filter
- **TopicCard**: Individual topic display component
- **TopicForm**: Create/edit topic form (admin only)
- **DocumentUpload**: PDF upload with progress tracking

#### Chat Interface Components
- **ChatContainer**: Main chat interface wrapper
- **MessageList**: Display conversation history
- **MessageInput**: Question input with send functionality
- **SessionSidebar**: Chat session management
- **TypingIndicator**: Shows when AI is generating response

#### Admin Components
- **AdminDashboard**: System overview and metrics
- **UserManagement**: User listing and administration
- **TopicManagement**: Topic CRUD operations
- **Analytics**: Usage statistics and insights

### Responsive Design Patterns
- Mobile-first approach using Tailwind CSS breakpoints
- Drawer navigation on mobile, sidebar on desktop
- Adaptive card layouts for different screen sizes
- Touch-friendly interaction elements

---

## 9. State Management

### Zustand Store Architecture

#### Store Structure
```typescript
// stores/authStore.ts - Authentication state
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// stores/topicStore.ts - Topics and documents
interface TopicState {
  topics: Topic[];
  selectedTopic: Topic | null;
  documents: Document[];
  isLoading: boolean;
  fetchTopics: () => Promise<void>;
  selectTopic: (topicId: string) => void;
  uploadDocument: (file: File, topicId: string) => Promise<void>;
}

// stores/chatStore.ts - Chat sessions and messages
interface ChatState {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  messages: Message[];
  isTyping: boolean;
  sendMessage: (content: string) => Promise<void>;
  createSession: (topicId: string) => Promise<void>;
  loadMessages: (sessionId: string) => Promise<void>;
}

// stores/uiStore.ts - UI state management
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  modals: ModalState;
  toggleSidebar: () => void;
  setTheme: (theme: string) => void;
  addNotification: (notification: Notification) => void;
}
```

#### State Persistence
- **Authentication**: JWT tokens persisted in localStorage
- **UI Preferences**: Theme and layout preferences stored locally
- **Chat History**: Recent sessions cached for offline access
- **Topic Selection**: Last selected topic remembered across sessions

#### State Updates with Immer
```typescript
// Example of complex state update using Immer
const updateMessage = (messageId: string, updates: Partial<Message>) =>
  set(
    produce((state) => {
      const message = state.messages.find(m => m.id === messageId);
      if (message) {
        Object.assign(message, updates);
      }
    })
  );
```

### Store Integration Patterns
- **Shallow Selectors**: Optimize component re-renders
- **Derived State**: Computed values using selectors
- **Cross-Store Communication**: Event-based updates between stores
- **Error Handling**: Centralized error state management

---

## 10. Authentication & Authorization

### JWT-Based Authentication Flow

#### Authentication Process
1. **User Login**
   - User submits credentials (email/password)
   - Backend validates against database (password hashing with bcrypt)
   - JWT access token generated with user claims
   - Token returned to frontend and stored securely

2. **Token Management**
   - Access tokens expire after 24 hours
   - Refresh tokens for session extension (optional)
   - Automatic token refresh before expiration
   - Secure token storage in httpOnly cookies (production) or localStorage (development)

3. **Request Authorization**
   - JWT token included in Authorization header
   - Backend middleware validates token on protected routes
   - User context extracted from token claims
   - Role-based access control enforced

#### Security Implementation

**Backend Security (Flask-JWT-Extended)**
```python
# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
JWT_ALGORITHM = 'HS256'

# Protected route decorator
@jwt_required()
def protected_endpoint():
    current_user = get_jwt_identity()
    return handle_request(current_user)

# Role-based authorization
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = get_jwt_identity()
        if current_user.get('role') != 'admin':
            return {'error': 'Admin access required'}, 403
        return f(*args, **kwargs)
    return decorated_function
```

**Frontend Security (React)**
```typescript
// Axios interceptor for token attachment
api.interceptors.request.use((config) => {
  const token = authStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Protected route component
function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
}
```

### Role-Based Access Control

#### User Roles
- **Student**: Can view topics, create chat sessions, ask questions
- **Admin**: Full system access including topic/document management

#### Permission Matrix
| Feature              | Student | Admin |
| -------------------- | ------- | ----- |
| View Topics          | ✅       | ✅     |
| Create Chat Sessions | ✅       | ✅     |
| Ask Questions        | ✅       | ✅     |
| Create Topics        | ❌       | ✅     |
| Upload Documents     | ❌       | ✅     |
| Manage Users         | ❌       | ✅     |
| View Analytics       | ❌       | ✅     |

---

## 11. AI Layer

### LangChain Integration Architecture

#### Document Processing Pipeline
```python
# 1. Document Loading
def load_and_split_pdf(file_path: str) -> List[Document]:
    loader = PyPDFLoader(file_path)
    pages = loader.load()
    
    # Text splitting for optimal chunking
    splitter = CharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separator="\n\n"
    )
    return splitter.split_documents(pages)

# 2. Embedding Generation
def create_embeddings(chunks: List[Document]) -> None:
    embeddings = OpenAIEmbeddings(
        openai_api_key=OPENAI_API_KEY,
        model="text-embedding-ada-002"
    )
    
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=f"chroma_db/{topic_id}"
    )
    vectorstore.persist()
```

#### Question-Answering Chain
```python
def build_qa_chain(topic_id: str) -> RetrievalQA:
    # Load vector store for topic
    embeddings = OpenAIEmbeddings()
    vectorstore = Chroma(
        persist_directory=f"chroma_db/{topic_id}",
        embedding_function=embeddings
    )
    
    # Configure retriever
    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 4}
    )
    
    # LLM configuration
    llm = ChatOpenAI(
        model_name="gpt-3.5-turbo",
        temperature=0.1,
        max_tokens=500
    )
    
    # Create QA chain
    return RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True
    )
```

### RAG (Retrieval-Augmented Generation) Flow

1. **Question Processing**
   - User question received via API
   - Question embedded using OpenAI embeddings
   - Semantic search performed in ChromaDB

2. **Context Retrieval**
   - Top-k most relevant document chunks retrieved
   - Source documents and relevance scores returned
   - Context prepared for LLM prompt

3. **Answer Generation**
   - Retrieved context combined with user question
   - Prompt sent to OpenAI GPT model
   - Generated answer returned with source attribution

4. **Response Enhancement**
   - Answer quality validation
   - Source document citation
   - Confidence scoring (future enhancement)

### Vector Database (ChromaDB) Management

#### Collection Organization
- **Topic-based Collections**: Each topic maintains separate collection
- **Metadata Storage**: Document titles, page numbers, upload timestamps
- **Deduplication**: File hash checking prevents duplicate embeddings
- **Incremental Updates**: New documents added without full reprocessing

#### Search Optimization
- **Similarity Threshold**: Configurable relevance filtering
- **Hybrid Search**: Combination of semantic and keyword search (future)
- **Result Ranking**: Custom scoring algorithms for better relevance

---

## 12. Tools & Libraries

### Backend Dependencies

#### Core Framework
- **Flask 3.0.0**: Lightweight web framework for API development
- **Flask-CORS 4.0.0**: Cross-origin resource sharing support
- **Flask-JWT-Extended 4.6.0**: JWT authentication implementation
- **Werkzeug 3.0.1**: WSGI utility library

#### Database & ORM
- **SQLAlchemy 2.0.25**: SQL toolkit and Object-Relational Mapping
- **Flask-SQLAlchemy 3.1.1**: Flask integration for SQLAlchemy
- **Flask-Migrate 4.0.5**: Database migration handling

#### AI & Machine Learning
- **langchain 0.1.0**: Framework for LLM application development
- **langchain-openai 0.0.5**: OpenAI integration for LangChain
- **langchain-community 0.0.10**: Community extensions for LangChain
- **openai ≥1.10.0**: Official OpenAI Python client
- **chromadb ≥0.4.24**: Vector database for embeddings
- **sentence-transformers 2.2.2**: Sentence embedding models

#### Document Processing
- **pypdf ≥3.15.0**: PDF text extraction and processing
- **python-multipart 0.0.6**: File upload handling
- **unstructured ≥0.10.0**: Universal document processing
- **python-docx ≥0.8.11**: Microsoft Word document processing
- **openpyxl ≥3.1.2**: Excel file processing
- **python-pptx ≥0.6.21**: PowerPoint processing
- **pandas ≥2.0.0**: Data manipulation and analysis

#### Development & Testing
- **pytest 7.4.3**: Testing framework
- **pytest-flask 1.3.0**: Flask-specific testing utilities
- **pytest-cov 4.1.0**: Test coverage reporting
- **black 23.11.0**: Code formatting
- **flake8 6.1.0**: Code linting and style guide enforcement

### Frontend Dependencies

#### Core Framework
- **react 19.1.0**: User interface library
- **react-dom 19.1.0**: React DOM rendering
- **typescript 5.8.3**: Static type checking
- **vite 6.3.5**: Build tool and development server

#### UI & Styling
- **antd 5.25.3**: Enterprise-class UI design language and components
- **@ant-design/icons 6.0.0**: Icon components for Ant Design
- **@ant-design/v5-patch-for-react-19 1.0.3**: React 19 compatibility patch
- **@tailwindcss/postcss 4.1.8**: Utility-first CSS framework

#### Routing & State Management
- **react-router-dom 7.6.1**: Declarative routing for React
- **zustand 5.0.5**: Small, fast, and scalable state management
- **immer 10.1.1**: Immutable state updates

#### Data & Utilities
- **axios 1.9.0**: Promise-based HTTP client
- **date-fns 4.1.0**: Modern JavaScript date utility library
- **date-fns-tz 3.2.0**: Timezone support for date-fns
- **recharts 2.15.3**: Charts library built on React components

#### Development Tools
- **@vitejs/plugin-react 4.4.1**: React plugin for Vite
- **eslint 9.25.0**: JavaScript linting utility
- **typescript-eslint 8.30.1**: TypeScript-specific linting rules
- **autoprefixer 10.4.21**: PostCSS plugin for vendor prefixes

### Infrastructure & Deployment
- **gunicorn 21.2.0**: Python WSGI HTTP Server for production
- **python-dotenv ≥1.0.0**: Environment variable management
- **Docker**: Containerization for consistent deployment
- **SQLite3**: Built-in Python database for development and small deployments

---

## 13. Deployment & Environment Setup

### Local Development Setup

#### Prerequisites
- **Python**: 3.9 or higher
- **Node.js**: 18.0 or higher
- **npm/yarn**: Package manager
- **Git**: Version control

#### Backend Setup
```bash
# Clone repository
git clone <repository-url>
cd asked/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Environment configuration
cp .env.template .env
# Edit .env with your configuration

# Database initialization
python manage_migrations.py db init
python manage_migrations.py db migrate -m "Initial migration"
python manage_migrations.py db upgrade

# Run development server
python app.py
```

#### Frontend Setup
```bash
# Navigate to frontend directory
cd asked/frontend

# Install dependencies
npm install  # or yarn install

# Environment configuration
cp .env.example .env.local
# Edit .env.local with backend URL

# Start development server
npm run dev  # or yarn dev
```

### Environment Variables

#### Backend Environment (.env)
```bash
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Database Configuration
DATABASE_URL=sqlite:///instance/assistant.db

# Upload Configuration
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216  # 16MB

# Chroma Configuration
CHROMA_DB_PATH=chroma_db

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
```

#### Frontend Environment (.env.local)
```bash
VITE_API_BASE_URL=http://localhost:5001
VITE_APP_NAME=AI Teaching Assistant
VITE_APP_VERSION=1.0.0
```

### Docker Deployment

#### Docker Configuration
```dockerfile
# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5001

CMD ["gunicorn", "--bind", "0.0.0.0:5001", "wsgi:app"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5001:5001"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=sqlite:///instance/assistant.db
    volumes:
      - ./backend/instance:/app/instance
      - ./backend/uploads:/app/uploads
      - ./backend/chroma_db:/app/chroma_db

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
```

### Production Deployment Considerations

#### Security
- Use secure JWT secret keys
- Configure HTTPS/SSL certificates
- Set up proper CORS policies
- Implement rate limiting
- Use environment-specific configuration

#### Performance
- Configure Gunicorn with appropriate worker processes
- Set up reverse proxy (Nginx) for static file serving
- Implement caching strategies
- Monitor resource usage and scaling needs

#### Monitoring & Logging
- Set up application logging with rotation
- Monitor API response times and error rates
- Track OpenAI API usage and costs
- Implement health checks for all services

---

## 14. Future Enhancements / TODOs

### Phase 1: Core Improvements

#### User Experience
- [ ] **Enhanced Chat Interface**
  - Message reactions and feedback system
  - Export chat sessions to PDF/Word
  - Advanced search within chat history
  - Real-time typing indicators

- [ ] **Mobile Application**
  - React Native mobile app
  - Offline capability for cached content
  - Push notifications for updates
  - Mobile-optimized UI/UX

#### Document Processing
- [ ] **Multi-format Support**
  - Microsoft Word (.docx) processing
  - PowerPoint (.pptx) processing
  - Excel (.xlsx) data extraction
  - Web page content extraction
  - YouTube transcript processing

- [ ] **Advanced Processing**
  - OCR for scanned documents
  - Table and figure extraction
  - Mathematical formula recognition
  - Multilingual document support

### Phase 2: Intelligence & Analytics

#### AI Enhancements
- [ ] **Improved RAG Pipeline**
  - Hybrid search (semantic + keyword)
  - Query expansion and reformulation
  - Multi-step reasoning capabilities
  - Confidence scoring for answers

- [ ] **Personalization**
  - Learning style adaptation
  - Personalized question suggestions
  - Progress tracking and analytics
  - Adaptive difficulty levels

#### Analytics & Insights
- [ ] **Student Analytics**
  - Learning progress visualization
  - Knowledge gap identification
  - Study pattern analysis
  - Performance predictions

- [ ] **Content Analytics**
  - Document effectiveness metrics
  - Question pattern analysis
  - Content recommendation engine
  - Usage heat maps

### Phase 3: Advanced Features

#### Collaboration & Social Learning
- [ ] **Study Groups**
  - Shared chat sessions
  - Collaborative note-taking
  - Peer-to-peer Q&A
  - Group study session planning

- [ ] **Gamification**
  - Point-based learning system
  - Achievement badges
  - Leaderboards and competitions
  - Progress celebrations

#### Integration & Automation
- [ ] **LMS Integration**
  - Canvas/Moodle/Blackboard plugins
  - Grade passback capabilities
  - Assignment integration
  - Calendar synchronization

- [ ] **Advanced Automation**
  - Automated content updates
  - Smart notification system
  - Bulk document processing
  - API for third-party integrations

### Phase 4: Scalability & Enterprise

#### Technical Scalability
- [ ] **Infrastructure Upgrades**
  - PostgreSQL database migration
  - Redis caching layer
  - Microservices architecture
  - Kubernetes deployment

- [ ] **Performance Optimization**
  - CDN integration for static assets
  - Database query optimization
  - Caching strategies
  - Load balancing

#### Enterprise Features
- [ ] **Multi-tenancy**
  - Institution-level isolation
  - Custom branding per tenant
  - Usage-based billing
  - Admin hierarchy management

- [ ] **Compliance & Security**
  - FERPA compliance
  - GDPR compliance
  - SSO integration (SAML/OAuth)
  - Advanced audit logging

### Development Process Improvements

#### Code Quality & Testing
- [ ] **Enhanced Testing**
  - Increase test coverage to >90%
  - Integration test suite
  - Performance testing
  - Accessibility testing

- [ ] **CI/CD Pipeline**
  - Automated testing on PRs
  - Staging environment deployment
  - Blue-green production deployment
  - Automated security scanning

#### Documentation & Community
- [ ] **Developer Resources**
  - API documentation with Swagger
  - SDK development for integrations
  - Plugin architecture
  - Community contribution guidelines

- [ ] **User Resources**
  - Video tutorial series
  - Best practices guide
  - FAQ and troubleshooting
  - Community forum

### Long-term Vision

#### AI Research Integration
- [ ] **Cutting-edge AI Features**
  - Integration with latest LLM models
  - Multimodal AI (text, image, audio)
  - Real-time learning from interactions
  - Adaptive questioning strategies

#### Educational Impact
- [ ] **Research & Evaluation**
  - Learning outcome studies
  - Pedagogical effectiveness research
  - A/B testing for feature impact
  - Academic publication of findings

---

## Conclusion

The AI Virtual Assistant for Student Q&A represents a modern approach to educational technology, leveraging state-of-the-art AI capabilities to enhance student learning experiences. Built with a robust technical foundation using React, Flask, and OpenAI technologies, the system provides a scalable platform for intelligent document-based question answering.

The architecture prioritizes maintainability, security, and user experience while providing clear pathways for future enhancements and scalability. With its comprehensive feature set and planned improvements, this platform is positioned to make a significant impact in the educational technology space.

---

*This documentation serves as a living document and will be updated as the project evolves and new features are implemented.*
