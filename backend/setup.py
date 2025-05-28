#!/usr/bin/env python3
"""
Setup script for the AI Virtual Assistant Flask Backend
"""
import os
import sys
import shutil
from pathlib import Path


def create_directories():
    """Create necessary directories."""
    directories = [
        'uploads',
        'chroma_db',
        'logs',
        'instance'
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✓ Created directory: {directory}")


def create_env_file():
    """Create .env file from template if it doesn't exist."""
    env_file = Path('.env')
    template_file = Path('.env.template')
    
    if not env_file.exists() and template_file.exists():
        shutil.copy(template_file, env_file)
        print("✓ Created .env file from template")
        print("⚠️  Please edit .env file and add your OpenAI API key")
    elif env_file.exists():
        print("✓ .env file already exists")
    else:
        print("❌ .env.template file not found")


def install_requirements():
    """Install Python requirements."""
    if Path('requirements.txt').exists():
        print("Installing Python requirements...")
        os.system(f"{sys.executable} -m pip install -r requirements.txt")
        print("✓ Python requirements installed")
    else:
        print("❌ requirements.txt file not found")


def initialize_database():
    """Initialize the database."""
    try:
        from migrations.migrate import DatabaseMigration
        
        print("Initializing database...")
        migration = DatabaseMigration()
        migration.migrate()
        print("✓ Database initialized successfully")
        
    except ImportError:
        print("❌ Could not import migration module. Make sure requirements are installed.")
    except Exception as e:
        print(f"❌ Database initialization failed: {str(e)}")


def main():
    """Main setup function."""
    print("🚀 Setting up AI Virtual Assistant Flask Backend")
    print("=" * 50)
    
    # Create directories
    print("\n📁 Creating directories...")
    create_directories()
    
    # Create .env file
    print("\n⚙️  Setting up environment...")
    create_env_file()
    
    # Install requirements
    print("\n📦 Installing requirements...")
    install_requirements()
    
    # Initialize database
    print("\n🗄️  Initializing database...")
    initialize_database()
    
    print("\n✅ Setup completed successfully!")
    print("\nNext steps:")
    print("1. Edit .env file and add your OpenAI API key")
    print("2. Run the development server: python app.py")
    print("3. API will be available at: http://localhost:5000")
    print("\nFor production deployment:")
    print("- Use gunicorn: gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app")


if __name__ == "__main__":
    main()
