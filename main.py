"""
Entry point for the AI Virtual Assistant for Student Q&A.
Run this file to start the Streamlit application.
"""
from app.ui import run_ui
from app import config  # Ensures dotenv loads environment variables early

if __name__ == "__main__":
    run_ui()