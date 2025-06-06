# AI Virtual Assistant - Flask Backend

A Flask-based REST API backend for the AI Virtual Assistant application that helps students learn through intelligent Q&A based on uploaded study materials.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Topic Management**: Create and manage study topics with document uploads
- **Document Processing**: PDF parsing and chunking using LangChain
- **Vector Store**: Semantic search using Chroma vector database
- **Q&A System**: AI-powered question answering using OpenAI GPT models
- **Chat Sessions**: Persistent chat sessions with message history
- **Admin Panel**: Administrative features for user and content management

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

### Database Migrations

Run migrations:

```bash
python migrations/migrate.py
```

Reset database (development only):

```bash
python migrations/migrate.py --reset
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
