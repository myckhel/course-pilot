#!/usr/bin/env python3
"""
Database Migration Management Script

This script handles both Flask-Migrate (Alembic) migrations and custom migrations.
It provides a unified interface for managing database schema changes.

Usage:
    python3 manage_migrations.py init          # Initialize Flask-Migrate
    python3 manage_migrations.py migrate       # Create new migration
    python3 manage_migrations.py upgrade       # Apply pending migrations
    python3 manage_migrations.py downgrade     # Rollback last migration
    python3 manage_migrations.py current       # Show current migration
    python3 manage_migrations.py history       # Show migration history
    python3 manage_migrations.py document      # Apply Document model migration
"""

import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))


def flask_migrate_init():
    """Initialize Flask-Migrate."""
    try:
        from flask_migrate import Migrate, init
        from app import create_app
        from app.extensions import db
        
        app = create_app('development')
        migrate = Migrate(app, db)
        
        with app.app_context():
            init()
            print("✅ Flask-Migrate initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize Flask-Migrate: {str(e)}")


def flask_migrate_create(message=None):
    """Create a new migration."""
    try:
        from flask_migrate import Migrate, migrate as create_migration
        from app import create_app
        from app.extensions import db
        
        app = create_app('development')
        migrate = Migrate(app, db)
        
        if not message:
            message = input("Enter migration message: ")
        
        with app.app_context():
            create_migration(message=message)
            print(f"✅ Migration created: {message}")
    except Exception as e:
        print(f"❌ Failed to create migration: {str(e)}")


def flask_migrate_upgrade():
    """Apply pending migrations."""
    try:
        from flask_migrate import Migrate, upgrade
        from app import create_app
        from app.extensions import db
        
        app = create_app('development')
        migrate = Migrate(app, db)
        
        with app.app_context():
            upgrade()
            print("✅ Database upgraded successfully")
    except Exception as e:
        print(f"❌ Failed to upgrade database: {str(e)}")


def flask_migrate_downgrade():
    """Rollback last migration."""
    try:
        from flask_migrate import Migrate, downgrade
        from app import create_app
        from app.extensions import db
        
        app = create_app('development')
        migrate = Migrate(app, db)
        
        with app.app_context():
            downgrade()
            print("✅ Database downgraded successfully")
    except Exception as e:
        print(f"❌ Failed to downgrade database: {str(e)}")


def flask_migrate_current():
    """Show current migration."""
    try:
        from flask_migrate import Migrate, current
        from app import create_app
        from app.extensions import db
        
        app = create_app('development')
        migrate = Migrate(app, db)
        
        with app.app_context():
            current()
    except Exception as e:
        print(f"❌ Failed to get current migration: {str(e)}")


def flask_migrate_history():
    """Show migration history."""
    try:
        from flask_migrate import Migrate, history
        from app import create_app
        from app.extensions import db
        
        app = create_app('development')
        migrate = Migrate(app, db)
        
        with app.app_context():
            history()
    except Exception as e:
        print(f"❌ Failed to get migration history: {str(e)}")


def apply_document_migration():
    """Apply the Document model migration."""
    try:
        from migrations.migrate_document_model import DocumentMigration
        
        migration = DocumentMigration()
        success = migration.migrate_to_document_model()
        
        if success:
            print("✅ Document model migration applied successfully")
        else:
            print("❌ Document model migration failed")
    except Exception as e:
        print(f"❌ Failed to apply Document migration: {str(e)}")


def show_help():
    """Show help message."""
    print(__doc__)


def main():
    """Main function."""
    if len(sys.argv) < 2:
        show_help()
        return
    
    command = sys.argv[1].lower()
    
    commands = {
        'init': flask_migrate_init,
        'migrate': lambda: flask_migrate_create(sys.argv[2] if len(sys.argv) > 2 else None),
        'upgrade': flask_migrate_upgrade,
        'downgrade': flask_migrate_downgrade,
        'current': flask_migrate_current,
        'history': flask_migrate_history,
        'document': apply_document_migration,
        'help': show_help,
    }
    
    if command in commands:
        commands[command]()
    else:
        print(f"Unknown command: {command}")
        show_help()


if __name__ == "__main__":
    main()
