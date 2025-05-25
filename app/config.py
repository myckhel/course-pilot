"""
Configuration module for the AI Virtual Assistant.
Handles loading of environment variables and database setup.
"""
from dotenv import load_dotenv
import os
from app.database import setup_sqlite_database

# Load environment variables from .env file
load_dotenv()

# Make API key available for OpenAI and LangChain
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

# Database configuration
DATABASE_PATH = "assistant.db"
TOPICS_STORAGE_DIR = "topics_storage"
VECTOR_STORE_BASE_DIR = "vector_stores"

# Initialize database on module import
setup_sqlite_database(DATABASE_PATH)

# Ensure storage directories exist
os.makedirs(TOPICS_STORAGE_DIR, exist_ok=True)
os.makedirs(VECTOR_STORE_BASE_DIR, exist_ok=True)