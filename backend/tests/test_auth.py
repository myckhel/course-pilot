"""
Test cases for authentication routes
"""
import pytest
from flask import json


class TestAuth:
    """Test authentication endpoints."""
    
    def test_register_success(self, client):
        """Test successful user registration."""
        response = client.post('/api/auth/register', json={
            'name': 'John Doe',
            'email': 'john@example.com',
            'password': 'securepassword',
            'role': 'student'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert 'access_token' in data
        assert 'user' in data
        assert data['user']['email'] == 'john@example.com'
        assert data['user']['name'] == 'John Doe'
        assert data['user']['role'] == 'student'
    
    def test_register_missing_fields(self, client):
        """Test registration with missing fields."""
        response = client.post('/api/auth/register', json={
            'name': 'John Doe',
            'email': 'john@example.com'
            # Missing password and role
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_register_invalid_email(self, client):
        """Test registration with invalid email."""
        response = client.post('/api/auth/register', json={
            'name': 'John Doe',
            'email': 'invalid-email',
            'password': 'securepassword',
            'role': 'student'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_register_duplicate_email(self, client):
        """Test registration with duplicate email."""
        # First registration
        client.post('/api/auth/register', json={
            'name': 'John Doe',
            'email': 'john@example.com',
            'password': 'securepassword',
            'role': 'student'
        })
        
        # Second registration with same email
        response = client.post('/api/auth/register', json={
            'name': 'Jane Doe',
            'email': 'john@example.com',
            'password': 'anotherpassword',
            'role': 'student'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_login_success(self, client):
        """Test successful login."""
        # Register user first
        client.post('/api/auth/register', json={
            'name': 'John Doe',
            'email': 'john@example.com',
            'password': 'securepassword',
            'role': 'student'
        })
        
        # Login
        response = client.post('/api/auth/login', json={
            'email': 'john@example.com',
            'password': 'securepassword'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
        assert 'user' in data
        assert data['user']['email'] == 'john@example.com'
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials."""
        response = client.post('/api/auth/login', json={
            'email': 'nonexistent@example.com',
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data
    
    def test_login_wrong_password(self, client):
        """Test login with wrong password."""
        # Register user first
        client.post('/api/auth/register', json={
            'name': 'John Doe',
            'email': 'john@example.com',
            'password': 'securepassword',
            'role': 'student'
        })
        
        # Login with wrong password
        response = client.post('/api/auth/login', json={
            'email': 'john@example.com',
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data
    
    def test_protected_route_without_token(self, client):
        """Test accessing protected route without token."""
        response = client.get('/api/topics')
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'msg' in data
    
    def test_protected_route_with_token(self, client, auth_headers):
        """Test accessing protected route with valid token."""
        response = client.get('/api/topics', headers=auth_headers)
        
        assert response.status_code == 200
