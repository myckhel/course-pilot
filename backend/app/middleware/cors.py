"""
CORS middleware and configuration.
"""
from flask import Flask
from flask_cors import CORS


def setup_cors(app: Flask) -> None:
    """Setup CORS configuration for the Flask app."""
    
    # Development CORS settings
    if app.config.get('FLASK_ENV') == 'development':
        CORS(app, origins=[
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173"
        ])
    else:
        # Production CORS settings
        # You should replace these with your actual frontend domains
        CORS(app, origins=[
            "https://yourapp.com",
            "https://www.yourapp.com"
        ])


def add_cors_headers(response):
    """Add CORS headers to response."""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response
