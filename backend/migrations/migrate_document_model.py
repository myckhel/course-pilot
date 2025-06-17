"""
Enhanced Database Migration Script with Document Model Support
"""
import sqlite3
import os
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class DocumentMigration:
    """Handle Document model migration specifically."""
    
    def __init__(self, db_path: str = None):
        if db_path is None:
            current_dir = Path(__file__).resolve().parent
            app_dir = current_dir.parent
            database_path = os.environ.get('DATABASE_PATH', 'instance/assistant.db')
            db_path = str(app_dir / database_path)
        
        self.db_path = db_path
        print(f"Using database path: {db_path}")
        
        # Ensure the directory exists
        db_dir = Path(self.db_path).parent
        db_dir.mkdir(parents=True, exist_ok=True)
    
    def check_document_table_exists(self) -> bool:
        """Check if the documents table already exists."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='documents'
                """)
                result = cursor.fetchone()
                return result is not None
        except sqlite3.OperationalError:
            return False
    
    def create_document_table(self):
        """Create the documents table with all required columns and indexes."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Create documents table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS documents (
                        id VARCHAR(36) PRIMARY KEY,
                        topic_id VARCHAR(36) NOT NULL,
                        filename VARCHAR(255) NOT NULL,
                        original_filename VARCHAR(255) NOT NULL,
                        file_path VARCHAR(500) NOT NULL,
                        file_hash VARCHAR(64) NOT NULL,
                        file_size INTEGER NOT NULL,
                        content_hash VARCHAR(64) NOT NULL,
                        chunk_count INTEGER DEFAULT 0 NOT NULL,
                        is_processed BOOLEAN DEFAULT 0 NOT NULL,
                        uploaded_by VARCHAR(36) NOT NULL,
                        created_at DATETIME NOT NULL,
                        updated_at DATETIME NOT NULL,
                        FOREIGN KEY (topic_id) REFERENCES topics(id),
                        FOREIGN KEY (uploaded_by) REFERENCES users(id)
                    )
                """)
                
                # Create indexes for better performance
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_documents_file_hash 
                    ON documents(file_hash)
                """)
                
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_documents_content_hash 
                    ON documents(content_hash)
                """)
                
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_documents_topic_id 
                    ON documents(topic_id)
                """)
                
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by 
                    ON documents(uploaded_by)
                """)
                
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_documents_is_processed 
                    ON documents(is_processed)
                """)
                
                conn.commit()
                print("✓ Documents table and indexes created successfully")
                
        except sqlite3.Error as e:
            print(f"❌ Error creating documents table: {str(e)}")
            raise
    
    def get_migration_version(self) -> int:
        """Get current migration version."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Check if migration_history table exists
                cursor.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='migration_history'
                """)
                
                if not cursor.fetchone():
                    # Create migration_history table
                    cursor.execute("""
                        CREATE TABLE migration_history (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            version VARCHAR(50) NOT NULL,
                            description TEXT,
                            applied_at DATETIME NOT NULL,
                            success BOOLEAN NOT NULL
                        )
                    """)
                    conn.commit()
                    return 0
                
                # Get latest successful migration
                cursor.execute("""
                    SELECT version FROM migration_history 
                    WHERE success = 1 
                    ORDER BY applied_at DESC 
                    LIMIT 1
                """)
                result = cursor.fetchone()
                
                if not result:
                    return 0
                
                # Return numeric part of version
                version_str = result[0]
                if version_str.startswith('001_'):
                    return 1
                return 0
                
        except sqlite3.Error:
            return 0
    
    def record_migration(self, version: str, description: str, success: bool):
        """Record migration in history."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO migration_history (version, description, applied_at, success)
                    VALUES (?, ?, ?, ?)
                """, (version, description, datetime.utcnow().isoformat(), success))
                conn.commit()
        except sqlite3.Error as e:
            print(f"⚠️  Could not record migration: {str(e)}")
    
    def migrate_to_document_model(self):
        """Migrate database to include Document model."""
        print("🔄 Starting Document model migration...")
        
        # Check current state
        current_version = self.get_migration_version()
        has_documents_table = self.check_document_table_exists()
        
        print(f"Current migration version: {current_version}")
        print(f"Documents table exists: {has_documents_table}")
        
        if has_documents_table and current_version >= 1:
            print("✅ Document model migration already applied")
            return True
        
        try:
            # Create documents table if it doesn't exist
            if not has_documents_table:
                self.create_document_table()
            
            # Record successful migration
            self.record_migration(
                version="001_add_document_model",
                description="Add Document model for file tracking and deduplication",
                success=True
            )
            
            print("✅ Document model migration completed successfully")
            return True
            
        except Exception as e:
            # Record failed migration
            self.record_migration(
                version="001_add_document_model",
                description="Add Document model for file tracking and deduplication",
                success=False
            )
            
            print(f"❌ Document model migration failed: {str(e)}")
            return False
    
    def rollback_document_model(self):
        """Rollback Document model migration."""
        print("🔄 Rolling back Document model migration...")
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Drop indexes
                cursor.execute("DROP INDEX IF EXISTS idx_documents_file_hash")
                cursor.execute("DROP INDEX IF EXISTS idx_documents_content_hash")
                cursor.execute("DROP INDEX IF EXISTS idx_documents_topic_id")
                cursor.execute("DROP INDEX IF EXISTS idx_documents_uploaded_by")
                cursor.execute("DROP INDEX IF EXISTS idx_documents_is_processed")
                
                # Drop table
                cursor.execute("DROP TABLE IF EXISTS documents")
                
                conn.commit()
                
            # Record rollback
            self.record_migration(
                version="001_add_document_model_rollback",
                description="Rollback Document model migration",
                success=True
            )
            
            print("✅ Document model migration rolled back successfully")
            return True
            
        except Exception as e:
            print(f"❌ Rollback failed: {str(e)}")
            return False


def main():
    """Main migration function."""
    print("🚀 Document Model Migration")
    print("=" * 40)
    
    migration = DocumentMigration()
    
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--rollback":
        success = migration.rollback_document_model()
    else:
        success = migration.migrate_to_document_model()
    
    if success:
        print("\n✅ Migration completed successfully!")
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()
