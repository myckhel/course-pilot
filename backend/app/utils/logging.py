"""
Logging configuration for the Flask application
"""
import logging
import logging.handlers
import os
from pathlib import Path


def setup_logging(app):
    """Configure logging for the Flask application."""
    
    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Get log level from config
    log_level = getattr(logging, app.config.get('LOG_LEVEL', 'INFO').upper())
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # File handler with rotation
    file_handler = logging.handlers.RotatingFileHandler(
        app.config.get('LOG_FILE', 'logs/app.log'),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(log_level)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(log_level)
    
    # Configure app logger
    app.logger.setLevel(log_level)
    app.logger.addHandler(file_handler)
    
    # Only add console handler in development
    if app.config.get('FLASK_ENV') == 'development':
        app.logger.addHandler(console_handler)
    
    # Configure other loggers
    loggers = [
        'werkzeug',
        'langchain',
        'chromadb',
        'openai'
    ]
    
    for logger_name in loggers:
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.WARNING)  # Reduce noise from third-party libraries
        logger.addHandler(file_handler)
    
    app.logger.info("Logging configured successfully")


def get_logger(name):
    """Get a logger instance."""
    return logging.getLogger(name)
