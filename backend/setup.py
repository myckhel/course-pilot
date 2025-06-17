#!/usr/bin/env python3
"""
Setup script for the AI Virtual Assistant Flask Backend
"""
import os
import sys
import shutil
import subprocess
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
    """Initialize the database using the migration system."""
    try:
        from app import create_app
        from app.extensions import db
        from app.services.database import DatabaseService
        import subprocess
        
        print("Initializing database using migration system...")
        
        # Create Flask application context
        app = create_app('development')
        
        with app.app_context():
            # Check if migration system is initialized
            migration_dir = Path('migrations')
            alembic_ini = migration_dir / 'alembic.ini'
            
            if not migration_dir.exists() or not alembic_ini.exists():
                print("🔧 Initializing migration system...")
                try:
                    # Use subprocess to call our manage_migrations.py script
                    result = subprocess.run([
                        sys.executable, 'manage_migrations.py', 'init'
                    ], capture_output=True, text=True, timeout=30)
                    
                    if result.returncode == 0:
                        print("✓ Migration system initialized")
                    else:
                        print(f"⚠️  Migration init warning: {result.stderr}")
                        print("📋 Falling back to direct initialization...")
                        # Try direct import as fallback
                        try:
                            from flask_migrate import Migrate, init
                            migrate = Migrate(app, db)
                            init()
                            print("✓ Migration system initialized (fallback)")
                        except Exception as e:
                            print(f"❌ Failed to initialize migration system: {str(e)}")
                            print("📋 Using direct table creation...")
                            db.create_all()
                            print("✓ Database tables created using fallback method")
                            
                except subprocess.TimeoutExpired:
                    print("⚠️  Migration init timeout, using fallback...")
                    db.create_all()
                    print("✓ Database tables created using fallback method")
                except Exception as e:
                    print(f"❌ Failed to run migration init: {str(e)}")
                    print("📋 Using direct table creation...")
                    db.create_all()
                    print("✓ Database tables created using fallback method")
            else:
                print("✓ Migration system already initialized")
            
            # Apply any pending migrations
            try:
                print("🔄 Applying database migrations...")
                result = subprocess.run([
                    sys.executable, 'manage_migrations.py', 'upgrade'
                ], capture_output=True, text=True, timeout=60)
                
                if result.returncode == 0:
                    print("✓ Database migrations applied successfully")
                else:
                    print(f"⚠️  Migration upgrade issues: {result.stderr}")
                    print("📋 Attempting direct migration...")
                    # Try direct import as fallback
                    try:
                        from flask_migrate import Migrate, upgrade
                        migrate = Migrate(app, db)
                        upgrade()
                        print("✓ Database migrations applied (fallback)")
                    except Exception as e:
                        print(f"⚠️  Direct migration failed: {str(e)}")
                        print("📋 Using table creation as final fallback...")
                        db.create_all()
                        print("✓ Database tables created using final fallback")
                        
            except subprocess.TimeoutExpired:
                print("⚠️  Migration upgrade timeout, using fallback...")
                db.create_all()
                print("✓ Database tables created using fallback method")
            except Exception as e:
                print(f"⚠️  Migration upgrade failed: {str(e)}")
                print("📋 Using table creation as fallback...")
                db.create_all()
                print("✓ Database tables created using fallback method")
            
            # Sync document counts for existing topics
            db_service = DatabaseService()
            if db_service.sync_topic_document_counts():
                print("✓ Topic document counts synchronized")
            
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
    """Initialize default GST topic and upload its document with deduplication."""
    print("\n📚 Initializing default GST topic...")
    try:
        from app import create_app
        from app.services.database import DatabaseService
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
            gst_topic = next((topic for topic in existing_topics if topic.name.lower() == 'gst'), None)
            
            if not gst_topic:
                # Create default GST topic
                gst_topic = db_service.create_topic(
                    name="GST",
                    description="AI-powered companion for GST courses",
                    created_by=admin.id
                )
                print("✓ Default GST topic created successfully")
            else:
                print("✓ GST topic already exists")

            # Load and process the default GST document with deduplication
            pdf_path = Path(__file__).parent / 'data' / 'CCMAS GST data .pdf'
            if pdf_path.exists():
                try:
                    print("📄 Checking GST document...")
                    
                    # Initialize vector service with deduplication
                    vector_service = VectorStoreService('chroma_db')
                    
                    # Save file to uploads folder
                    upload_dir = Path('uploads') / gst_topic.id
                    upload_dir.mkdir(exist_ok=True)
                    dest_path = upload_dir / 'CCMAS GST data .pdf'
                    
                    # Copy file if it doesn't exist
                    if not dest_path.exists():
                        shutil.copy2(pdf_path, dest_path)
                    
                    # Process document with deduplication check
                    success, message, chunk_count = vector_service.create_topic_index_with_deduplication(
                        topic_id=gst_topic.id,
                        file_path=str(dest_path),
                        original_filename='CCMAS GST data .pdf',
                        uploaded_by=admin.id
                    )
                    
                    if success:
                        print(f"✓ {message}")
                        # Sync topic document count
                        db_service.sync_topic_document_counts()
                    else:
                        print(f"ℹ️  {message}")
                        
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
    print("\nUtility Scripts:")
    print("🔍 Check for duplicate documents: python check_duplicates.py")
    print("🧹 Clean up duplicates: python check_duplicates.py --clean")
    print("📊 Analyze only: python check_duplicates.py --analyze-only")
    print("\nFor production deployment:")
    print("- Use gunicorn: gunicorn -w 4 -b 0.0.0.0:8000 wsgi:app")


if __name__ == "__main__":
    main()
