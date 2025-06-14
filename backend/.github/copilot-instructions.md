## 🚀 Copilot Instructions for Flask API (Senior Level)

> ✅ Use Blueprints, Flask-RESTful (or Flask-RestX), SQLAlchemy, Marshmallow, JWT Auth, environment config, and type hints throughout.

## Tech Stack

- **Framework**: Flask 3.0
- **Authentication**: Flask-JWT-Extended
- **Database**: SQLite3
- **Vector Store**: ChromaDB
- **AI/ML**: LangChain + OpenAI
- **Document Processing**: PyPDF
- **CORS**: Flask-CORS

## Project File Structure

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

### 🔧 Project Structure

```python
# Generate a scalable Flask API structure using Blueprints.
# Separate concerns by creating directories: `routes`, `models`, `schemas`, `services`, `config`, `auth`.
# Use application factory pattern for initialization and register extensions inside `extensions.py`.
```

### 🔐 Authentication

```python
# Implement JWT-based authentication using Flask-JWT-Extended.
# Create routes for login and registration.
# Hash passwords using bcrypt and return tokens securely.
```

### 🧱 Models (SQLAlchemy)

```python
# Define a SQLAlchemy model `User` with fields: id (primary key), username (unique), email (unique), and password (hashed).
# Add created_at and updated_at with automatic timestamping using SQLAlchemy events.
```

### 🧪 Validation (Marshmallow)

```python
# Create a Marshmallow schema `UserSchema` with field validation and serialization.
# Include `load_only` for password and `dump_only` for timestamps.
```

### 📦 API Endpoints

```python
# Create a RESTful resource `UserResource` using Flask-RESTful.
# Add GET (retrieve single user), POST (create), PUT (update), DELETE methods.
# Validate payloads with Marshmallow, handle exceptions gracefully.
```

### ⚙️ Config & Initialization

```python
# Set up a `config.py` with class-based configuration: DevelopmentConfig, ProductionConfig.
# Use `.env` variables via python-dotenv to manage secrets.
# Load config via `create_app()` and environment selection.
```

### 🛠 Error Handling

```python
# Define custom error handlers for 400, 401, 404, and 500.
# Return JSON responses with consistent format: { "error": "message" }.
```

### 🧪 Testing

```python
# Write Pytest unit tests for the User model and API routes.
# Use a test database and fixtures to isolate test environments.
```

### 🧼 Linting & Tooling

```text
# Set up Black for formatting, Flake8 for linting, and MyPy for type checking.
# Add a Makefile or tasks.py to automate common commands (e.g., run, test, lint).
```

### ✅ Example Full Copilot Instruction (Multiline Comment)

```python
"""
Create a Flask REST API using Flask-RESTful for managing users.
- Define User model with id, username, email, password
- Use Marshmallow for schema validation
- Secure passwords with bcrypt
- Add JWT authentication with login and protected routes
- Return paginated results for GET /users
- Use application factory and Blueprints for modular structure
"""
```
