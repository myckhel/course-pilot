"""
Test configuration and fixtures for the Flask application
"""
import pytest
import tempfile
import os
from app import create_app
from app.services.database import DatabaseService


@pytest.fixture
def app():
    """Create and configure a test Flask app."""
    # Create a temporary database file
    db_fd, db_path = tempfile.mkstemp()
    
    app = create_app('testing')
    app.config.update({
        'TESTING': True,
        'DATABASE_URL': f'sqlite:///{db_path}',
        'JWT_SECRET_KEY': 'test-secret-key',
        'SECRET_KEY': 'test-secret-key'
    })
    
    # Initialize database
    with app.app_context():
        db_service = DatabaseService(db_path)
        db_service.setup_database()
    
    yield app
    
    # Cleanup
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create a test CLI runner."""
    return app.test_cli_runner()


@pytest.fixture
def auth_headers(client):
    """Create authentication headers for testing."""
    # Register a test user
    client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'test@example.com',
        'password': 'testpassword',
        'role': 'student'
    })
    
    # Login and get token
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'testpassword'
    })
    
    token = response.get_json()['access_token']
    
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def admin_headers(client):
    """Create admin authentication headers for testing."""
    # Register an admin user
    client.post('/api/auth/register', json={
        'name': 'Admin User',
        'email': 'admin@example.com',
        'password': 'adminpassword',
        'role': 'admin'
    })
    
    # Login and get token
    response = client.post('/api/auth/login', json={
        'email': 'admin@example.com',
        'password': 'adminpassword'
    })
    
    token = response.get_json()['access_token']
    
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def sample_topic(client, admin_headers):
    """Create a sample topic for testing."""
    response = client.post('/api/topics', 
        json={
            'name': 'Test Topic',
            'description': 'A test topic for testing'
        },
        headers=admin_headers
    )
    
    return response.get_json()
