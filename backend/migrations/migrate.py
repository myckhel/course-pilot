"""
Database migration script for the AI Virtual Assistant Flask application
"""
import sqlite3
import os
from datetime import datetime
from pathlib import Path


class DatabaseMigration:
    """Handle database migrations."""
    
    def __init__(self, db_path: str = "asked.db"):
        self.db_path = db_path
        self.migrations_dir = Path("migrations")
        self.migrations_dir.mkdir(exist_ok=True)
    
    def get_current_version(self) -> int:
        """Get current database version."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT version FROM schema_versions 
                    ORDER BY version DESC LIMIT 1
                """)
                result = cursor.fetchone()
                return result[0] if result else 0
        except sqlite3.OperationalError:
            return 0
    
    def create_schema_versions_table(self):
        """Create schema versions table."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS schema_versions (
                    version INTEGER PRIMARY KEY,
                    applied_at TEXT NOT NULL,
                    description TEXT
                )
            """)
            conn.commit()
    
    def run_migration_001_initial_schema(self):
        """Initial database schema."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'student',
                    created_at TEXT NOT NULL
                )
            """)
            
            # Topics table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS topics (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_by TEXT NOT NULL,
                    document_count INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (created_by) REFERENCES users (id)
                )
            """)
            
            # Chat sessions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    topic_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (topic_id) REFERENCES topics (id)
                )
            """)
            
            # Messages table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    sender TEXT NOT NULL,
                    message TEXT NOT NULL,
                    sources TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
                )
            """)
            
            # Create indexes
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_topics_created_by ON topics (created_by)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON chat_sessions (user_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_topic_id ON chat_sessions (topic_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages (session_id)")
            
            conn.commit()
    
    def apply_migration(self, version: int, description: str, migration_func):
        """Apply a specific migration."""
        current_version = self.get_current_version()
        
        if current_version >= version:
            print(f"Migration {version} already applied, skipping...")
            return
        
        print(f"Applying migration {version}: {description}")
        
        try:
            migration_func()
            
            # Record migration
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO schema_versions (version, applied_at, description)
                    VALUES (?, ?, ?)
                """, (version, datetime.now().isoformat(), description))
                conn.commit()
            
            print(f"Migration {version} applied successfully")
        
        except Exception as e:
            print(f"Error applying migration {version}: {str(e)}")
            raise
    
    def migrate(self):
        """Run all pending migrations."""
        print("Starting database migration...")
        
        # Ensure schema versions table exists
        self.create_schema_versions_table()
        
        # Define migrations
        migrations = [
            (1, "Initial database schema", self.run_migration_001_initial_schema),
        ]
        
        # Apply each migration
        for version, description, migration_func in migrations:
            self.apply_migration(version, description, migration_func)
        
        print("Database migration completed successfully")
    
    def reset_database(self):
        """Reset database (for development only)."""
        if os.path.exists(self.db_path):
            os.remove(self.db_path)
            print(f"Database {self.db_path} removed")
        
        self.migrate()
        print("Database reset and recreated")


def main():
    """Main migration function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Database migration tool")
    parser.add_argument("--reset", action="store_true", help="Reset database")
    parser.add_argument("--db-path", default="asked.db", help="Database file path")
    
    args = parser.parse_args()
    
    migration = DatabaseMigration(args.db_path)
    
    if args.reset:
        confirmation = input("Are you sure you want to reset the database? (yes/no): ")
        if confirmation.lower() == 'yes':
            migration.reset_database()
        else:
            print("Database reset cancelled")
    else:
        migration.migrate()


if __name__ == "__main__":
    main()
