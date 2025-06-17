"""
Routes module for the AI Teaching Assistant backend.
"""
from .auth import auth_bp
from .topics import topics_bp
from .documents import documents_bp
from .chat import chat_bp
from .admin import admin_bp

__all__ = [
    'auth_bp',
    'topics_bp',
    'documents_bp',
    'chat_bp',
    'admin_bp'
]
