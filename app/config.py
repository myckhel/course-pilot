"""
Configuration module for the AI Virtual Assistant.
Handles loading of environment variables.
"""
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Make API key available for OpenAI and LangChain
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")