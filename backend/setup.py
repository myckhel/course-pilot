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
        from app import create_app
        from app.extensions import db
        from app.services.database import DatabaseService
        
        print("Initializing database...")
        
        # Create Flask application context
        app = create_app('development')
        
        with app.app_context():
            # Create all tables
            db.create_all()
            print("✓ Database tables created successfully")
            
            # Create default admin user
            db_service = DatabaseService()
            
            # Check if admin user already exists
            admin_email = 'admin@asked.com'
            existing_admin = db_service.get_user_by_email(admin_email)
            
            if not existing_admin:
                admin_user = db_service.create_user(
                    name='Admin User',
                    email=admin_email,
                    password='admin123',  # Default password - should be changed
                    role='admin'
                )
                print(f"✓ Default admin user created: {admin_email}")
                print("⚠️  Default password is 'admin123' - please change it after first login")
            else:
                print("✓ Admin user already exists")
            
            # Create default student user for testing (optional)
            student_email = 'student@asked.com'
            existing_student = db_service.get_user_by_email(student_email)
            
            if not existing_student:
                student_user = db_service.create_user(
                    name='Test Student',
                    email=student_email,
                    password='student123',  # Default password - should be changed
                    role='student'
                )
                print(f"✓ Default student user created: {student_email}")
                print("⚠️  Default password is 'student123' - please change it after first login")
            else:
                print("✓ Student test user already exists")
        
        print("✓ Database initialized successfully")
        
    except ImportError as e:
        print(f"❌ Could not import required modules: {str(e)}")
    except Exception as e:
        print(f"❌ Database initialization failed: {str(e)}")


def initialize_default_topic():
    """Initialize default GST topic and upload its document."""
    print("\n📚 Initializing default GST topic...")
    try:
        from app import create_app
        from app.services.database import DatabaseService
        from app.services.document_loader import DocumentLoader
        from app.services.vector_store import VectorStoreService
        from pathlib import Path
        
        # Create Flask application context
        app = create_app('development')
        
        with app.app_context():
            db_service = DatabaseService()
            
            # Get admin user id (first admin in the system)
            users, _ = db_service.get_all_users()
            admin = next((user for user in users if user.role == 'admin'), None)
            if not admin:
                print("❌ No admin user found. Please run database initialization first.")
                return
            
            # Check if GST topic already exists
            existing_topics = db_service.get_all_topics()
            if any(topic.name.lower() == 'gst' for topic in existing_topics):
                print("✓ GST topic already exists")
                return
            
            # Create default GST topic
            topic = db_service.create_topic(
                name="GST",
                description="AI-powered companion for GST courses",
                created_by=admin.id
            )
            print("✓ Default GST topic created successfully")

            # Load and process the default GST document
            pdf_path = Path(__file__).parent / 'data' / 'CCMAS GST data .pdf'
            if pdf_path.exists():
                try:
                    print("📄 Processing GST document...")
                    # Initialize services with smaller chunk size to handle token limits
                    doc_loader = DocumentLoader(chunk_size=500, chunk_overlap=50)
                    vector_service = VectorStoreService('chroma_db')
                    
                    # Save file to uploads folder
                    upload_dir = Path('uploads') / topic.id
                    upload_dir.mkdir(exist_ok=True)
                    dest_path = upload_dir / 'CCMAS GST data .pdf'
                    shutil.copy2(pdf_path, dest_path)
                    
                    # Process document in chunks
                    chunks = doc_loader.load_and_split_pdf(str(dest_path))
                    
                    if not chunks:
                        print("❌ No content could be extracted from the PDF")
                        return
                    
                    # Create or update vector index
                    if vector_service.topic_index_exists(topic.id):
                        vector_service.update_topic_index(topic.id, chunks)
                    else:
                        vector_service.create_topic_index(topic.id, chunks)
                    
                    # Update topic document count
                    db_service.increment_topic_document_count(topic.id)
                    print(f"✓ GST document processed and indexed successfully ({len(chunks)} chunks created)")
                except Exception as e:
                    print(f"❌ Failed to process GST document: {str(e)}")
            else:
                print("⚠️  Default GST document not found at:", pdf_path)
        
    except Exception as e:
        print(f"❌ Failed to initialize default topic: {str(e)}")


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
    
    # Initialize default topic
    initialize_default_topic()
    
    print("\n✅ Setup completed successfully!")
    print("\nDefault Credentials:")
    print("🔑 Admin Login:")
    print("   Email: admin@asked.com")
    print("   Password: admin123")
    print("🔑 Student Login (for testing):")
    print("   Email: student@asked.com") 
    print("   Password: student123")
    print("\n⚠️  IMPORTANT: Change default passwords after first login!")
    print("\nNext steps:")
    print("1. Edit .env file and add your OpenAI API key")
    print("2. Run the development server: python app.py")
    print("3. API will be available at: http://localhost:8000")
    print("\nFor production deployment:")
    print("- Use gunicorn: gunicorn -w 4 -b 0.0.0.0:8000 wsgi:app")


if __name__ == "__main__":
    main()
