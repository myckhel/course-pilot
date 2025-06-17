# AI Virtual Assistant - Flask Backend

A Flask-based REST API backend for the AI Virtual Assistant application that helps students learn through intelligent Q&A based on uploaded study materials.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Topic Management**: Create and manage study topics with document uploads
- **Document Processing**: PDF parsing and chunking using LangChain
- **Document Deduplication**: Prevents duplicate documents in vector store and database
- **Vector Store**: Semantic search using Chroma vector database
- **Q&A System**: AI-powered question answering using OpenAI GPT models
- **Chat Sessions**: Persistent chat sessions with message history
- **Admin Panel**: Administrative features for user and content management
- **Database Migrations**: Flask-Migrate integration for schema versioning

## Tech Stack

- **Framework**: Flask 3.0
- **Authentication**: Flask-JWT-Extended
- **Database**: SQLite3
- **Vector Store**: ChromaDB
- **AI/ML**: LangChain + OpenAI
- **Document Processing**: PyPDF
- **CORS**: Flask-CORS

## Project Structure

```
backend/
├── app/
│   ├── __init__.py              # Flask app factory
│   ├── config.py                # Configuration classes
│   ├── models/                  # Data models
│   ├── services/                # Business logic services
│   ├── routes/                  # API endpoints
│   ├── utils/                   # Utility functions
│   └── middleware/              # Custom middleware
├── migrations/                  # Database migrations
├── tests/                       # Test suite
├── uploads/                     # File uploads
├── chroma_db/                   # Vector store data
├── logs/                        # Application logs
├── requirements.txt             # Python dependencies
├── .env.template               # Environment variables template
├── app.py                      # Development server entry point
├── wsgi.py                     # Production WSGI entry point
└── setup.py                    # Setup script
```

## Quick Start

### 1. Clone and Setup

```bash
cd backend
python setup.py
```

This will:
- Create necessary directories
- Copy `.env.template` to `.env`
- Install Python requirements
- Initialize the database

### 2. Configure Environment

Edit `.env` file and add your OpenAI API key:

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. Run Development Server

```bash
python app.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

### Topics
- `GET /api/topics` - List all topics
- `POST /api/topics` - Create new topic (admin only)
- `GET /api/topics/{id}` - Get specific topic
- `POST /api/topics/{id}/documents` - Upload document (admin only)

### Chat
- `GET /api/chat/sessions` - Get user's chat sessions
- `POST /api/chat/sessions` - Create new chat session
- `POST /api/chat/message` - Send message and get AI response

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/stats` - System statistics

### Health Check
- `GET /api/health` - Service health status

## Document Deduplication

The backend includes a robust document deduplication system to prevent duplicate content from being processed:

### Features

- **File-level deduplication**: Prevents uploading identical files using SHA-256 file hashes
- **Content-level deduplication**: Prevents processing documents with identical content even if file names differ
- **Database tracking**: Maintains records of all uploaded documents with metadata
- **Automatic cleanup**: Removes duplicate files automatically during upload

### How it works

1. When a document is uploaded, the system calculates both file hash and content hash
2. Checks existing documents for duplicates using both hashes
3. If duplicate is found, returns reference to existing document without processing
4. If unique, processes the document and adds to vector store
5. Creates database record for tracking and future deduplication

### API Response for Duplicates

When uploading a duplicate document, the API returns:

```json
{
  "message": "Document already exists",
  "duplicate": true,
  "existing_document": {
    "id": "document_id",
    "filename": "original_filename.pdf",
    "upload_date": "2025-06-17T01:00:00Z"
  }
}
```

## Testing

Run the test suite:

```bash
pytest
```

Run with coverage:

```bash
pytest --cov=app tests/
```

## Production Deployment

### Using Gunicorn

```bash
gunicorn -w 4 -b 0.0.0.0:8000 wsgi:app
```

### Environment Variables

Required environment variables for production:

```bash
FLASK_ENV=production
SECRET_KEY=your-production-secret-key
JWT_SECRET_KEY=your-production-jwt-secret
OPENAI_API_KEY=your-openai-api-key
DATABASE_PATH=/path/to/production.db
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN python migrations/migrate.py

EXPOSE 8000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "wsgi:app"]
```

## Development

## Database Migrations

The application uses Flask-Migrate (Alembic) for database schema management.

### Initialize Migrations (first time only)

```bash
python3 manage_migrations.py init
```

### Create New Migration

```bash
python3 manage_migrations.py migrate
```

### Apply Migrations

```bash
python3 manage_migrations.py upgrade
```

### Rollback Migrations

```bash
python3 manage_migrations.py downgrade
```

### Check Migration Status

```bash
python3 manage_migrations.py current    # Show current migration
python3 manage_migrations.py history    # Show migration history
```

### Reset Database (Development Only)

```bash
python3 manage_migrations.py downgrade  # Rollback to base
# Then delete the database file and re-run setup
```

## Document Deduplication

The application includes robust document deduplication to prevent duplicate files from being processed:

### Features

- **File Hash Checking**: Prevents identical files from being uploaded
- **Content Hash Checking**: Detects files with identical content but different names
- **Per-Topic Deduplication**: Same file can exist in different topics
- **Database Tracking**: All uploaded documents are tracked in the database

### How It Works

1. When a document is uploaded, the system calculates:
   - **File Hash**: SHA-256 of the entire file
   - **Content Hash**: SHA-256 of extracted text content

2. Before processing, the system checks:
   - Is this file hash already in the database for this topic?
   - Is this content hash already in the database for this topic?

3. If duplicate found:
   - File upload is rejected with appropriate message
   - No processing resources are wasted
   - Vector store remains clean

4. If no duplicate:
   - Document is processed and added to vector store
   - Document record is saved in database
   - Vector store index is updated

### Manual Deduplication Check

```bash
python3 check_duplicates.py
```

### Code Quality

Format code with Black:

```bash
black app/ tests/
```

Lint with Flake8:

```bash
flake8 app/ tests/
```

## Configuration

The application supports multiple configuration environments:

- **Development**: Debug enabled, verbose logging
- **Production**: Optimized for performance and security
- **Testing**: In-memory database, minimal logging

## Security

- JWT tokens for authentication
- Role-based access control (admin/student)
- Input validation and sanitization
- Secure file upload handling
- CORS configuration for frontend integration

## Performance

- Database connection pooling
- Efficient vector similarity search
- Paginated API responses
- Background document processing
- Optimized LLM queries

## Contributing

1. Create a virtual environment
2. Install development dependencies
3. Run tests before submitting changes
4. Follow code style guidelines (Black, Flake8)

## License

This project is part of the AI Virtual Assistant application for educational purposes.

## Database Migrations

The backend uses Flask-Migrate for database schema management:

### Migration Commands

```bash
# Initialize migration system (run once)
python manage_migrations.py init

# Create new migration after model changes
python manage_migrations.py migrate -m "Description of changes"

# Apply migrations to database
python manage_migrations.py upgrade

# Rollback to previous migration
python manage_migrations.py downgrade

# View migration history
python manage_migrations.py history

# View current migration version
python manage_migrations.py current
```

### Migration Files

- `migrations/versions/` - Contains all migration scripts
- `migrations/alembic.ini` - Alembic configuration
- `manage_migrations.py` - Unified migration management CLI

### Document Model Migration

The Document model was added to track uploaded files and enable deduplication:

```sql
CREATE TABLE document (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    file_size INTEGER,
    topic_id VARCHAR(36) NOT NULL,
    uploader_id VARCHAR(36) NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_processed BOOLEAN DEFAULT FALSE,
    chunk_count INTEGER
);
```
