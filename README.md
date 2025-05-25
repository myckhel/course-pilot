# AI Virtual Assistant for Student Q&A

A **multi-user AI-powered assistant** designed to enhance the learning experience of students in higher education. This application enables multiple users to interact with an AI assistant within organized topic-based conversations, with persistent storage and role-based access control.

## ✨ Features

### For Students:
- **Topic Selection**: Choose from topics created by administrators
- **Interactive Chat**: Ask questions about uploaded study materials
- **Session Management**: Create and access multiple chat sessions per topic
- **Persistent History**: Access your conversation history across sessions
- **AI Responses**: Get intelligent, context-aware answers from study materials

### For Administrators:
- **Topic Management**: Create and organize study topics
- **PDF Upload**: Upload and process study materials for each topic
- **Content Control**: Manage educational content and materials
- **Multi-user Access**: All admin features plus student capabilities

### Technical Features:
- **Multi-user Authentication**: Secure login system with role-based access
- **Vector Storage**: Efficient similarity search using ChromaDB
- **Persistent Database**: SQLite database for users, topics, and chat history
- **Real-time Chat**: Modern chat interface with message history
- **Topic Isolation**: Each topic maintains its own vector store and knowledge base

## Technology Stack

- **LangChain**: Framework for developing applications powered by language models
- **ChromaDB**: Efficient similarity search and vector storage for topic-based knowledge bases
- **OpenAI**: GPT model for natural language processing and intelligent responses
- **Streamlit**: Modern web interface with multi-user support and real-time chat
- **SQLite**: Persistent database for user management, topics, and chat sessions
- **PyPDF**: PDF parsing and text extraction utility

## Database Schema

The application uses SQLite with the following tables:

- **Users**: User accounts with role-based access (admin/student)
- **Topics**: Study topics with associated PDF materials and vector stores
- **Chat Sessions**: Individual conversation sessions between users and topics
- **Messages**: Chat message history with timestamps

## Setup Instructions

1. Clone this repository
2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=sk-your-api-key
   ```
   Note: The .env file is ignored by git to protect your API keys.
5. Run the application:
   ```
   source venv/bin/activate && streamlit run main.py
   ```

## Usage

### First Time Setup
1. Launch the application: `streamlit run main.py`
2. **Default Admin Account**:
   - Username: `admin`
   - Password: `admin123`

### For Administrators
1. **Login** with admin credentials
2. **Create Topics**:
   - Enter topic name and description
   - Upload PDF study materials
   - Wait for document processing and indexing
3. **Manage Content**: View and organize existing topics
4. **Use Student Features**: Access all student functionality

### For Students
1. **Register** a new account or login with existing credentials
2. **Select Topic**: Choose from available topics in the sidebar
3. **Start Chat Session**:
   - Click "➕ New Session" to create a new conversation
   - Or select an existing session to continue
4. **Ask Questions**: Type questions about the study material
5. **Get AI Responses**: Receive intelligent answers based on the uploaded content
6. **Session History**: Access your previous conversations anytime

### Example Workflow
1. Admin uploads "Introduction to AI" lecture notes
2. Students log in and select the "Introduction to AI" topic
3. Students ask questions like:
   - "What are the main types of machine learning?"
   - "Explain natural language processing"
   - "What is the difference between supervised and unsupervised learning?"
4. AI provides detailed answers based on the uploaded lecture content

## Version Control & .gitignore

This project includes a `.gitignore` file that prevents sensitive information and large generated files from being committed to version control:

- **`.env` file** - Contains API keys that should never be committed
- **`chroma_db/` directory** - Contains vector database files that can be regenerated
- **Virtual environment directories** - Such as `venv/` or `env/`
- **`__pycache__/` and other Python cache files** - To keep the repository clean
- **`.pdf` files** - Sample or uploaded documents used for testing
- **OS-specific files** - Like `.DS_Store` on macOS

When contributing to this project, ensure you don't manually bypass these exclusions to maintain security.

## Project Structure

```
app/
│   ├── __init__.py
│   ├── config.py           # Environment and database configuration
│   ├── database.py         # SQLite database operations and schema
│   ├── document_loader.py  # PDF handling and text chunking
│   ├── vector_store.py     # ChromaDB embedding & retrieval by topic
│   ├── qa_chain.py         # LangChain QA logic and chain building
│   └── ui.py               # Multi-user Streamlit interface
│
├── main.py                 # Application entry point
├── assistant.db            # SQLite database (auto-created)
├── topics_storage/         # Uploaded PDF files (auto-created)
├── vector_stores/          # Topic-specific vector databases (auto-created)
├── requirements.txt        # Python dependencies
├── .env                    # API key storage
├── .gitignore              # Version control exclusions
└── README.md
```