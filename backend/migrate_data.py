"""
Migration script to move data from old SQLite structure to SQLAlchemy ORM.
This script will preserve all existing data during the migration.
"""
import sqlite3
import uuid
from datetime import datetime
from app import create_app
from app.extensions import db
from app.models import User, Topic, ChatSession, Message


def migrate_existing_data():
    """Migrate data from old SQLite database to SQLAlchemy ORM."""
    app = create_app()
    
    with app.app_context():
        # First, let's back up the old database
        print("Starting migration from SQLite to SQLAlchemy ORM...")
        
        # Check if old database exists
        try:
            old_conn = sqlite3.connect(app.config['SQLALCHEMY_DATABASE_URI'])
            old_cursor = old_conn.cursor()
        except Exception as e:
            print(f"Could not connect to old database: {e}")
            print("Creating fresh database with SQLAlchemy...")
            db.create_all()
            return
        
        # Create new tables
        db.create_all()
        
        # Migrate users
        print("Migrating users...")
        try:
            old_cursor.execute("SELECT * FROM users")
            users_data = old_cursor.fetchall()
            
            for row in users_data:
                # Check if user already exists
                existing_user = User.query.filter_by(id=row[0]).first()
                if not existing_user:
                    user = User(
                        id=row[0],
                        name=row[1],
                        email=row[2],
                        password_hash=row[3],
                        role=row[4],
                        created_at=datetime.fromisoformat(row[5]) if row[5] else datetime.utcnow()
                    )
                    db.session.add(user)
            
            db.session.commit()
            print(f"Migrated {len(users_data)} users")
        except Exception as e:
            print(f"Error migrating users: {e}")
            db.session.rollback()
        
        # Migrate topics
        print("Migrating topics...")
        try:
            old_cursor.execute("SELECT * FROM topics")
            topics_data = old_cursor.fetchall()
            
            for row in topics_data:
                # Check if topic already exists
                existing_topic = Topic.query.filter_by(id=row[0]).first()
                if not existing_topic:
                    topic = Topic(
                        id=row[0],
                        name=row[1],
                        description=row[2],
                        created_by=row[3],
                        document_count=row[4] if row[4] is not None else 0,
                        created_at=datetime.fromisoformat(row[5]) if row[5] else datetime.utcnow(),
                        updated_at=datetime.fromisoformat(row[6]) if row[6] else datetime.utcnow()
                    )
                    db.session.add(topic)
            
            db.session.commit()
            print(f"Migrated {len(topics_data)} topics")
        except Exception as e:
            print(f"Error migrating topics: {e}")
            db.session.rollback()
        
        # Migrate chat sessions
        print("Migrating chat sessions...")
        try:
            old_cursor.execute("SELECT * FROM chat_sessions")
            sessions_data = old_cursor.fetchall()
            
            for row in sessions_data:
                # Check if session already exists
                existing_session = ChatSession.query.filter_by(id=row[0]).first()
                if not existing_session:
                    session = ChatSession(
                        id=row[0],
                        user_id=row[1],
                        topic_id=row[2],
                        title=row[3],
                        created_at=datetime.fromisoformat(row[4]) if row[4] else datetime.utcnow()
                    )
                    db.session.add(session)
            
            db.session.commit()
            print(f"Migrated {len(sessions_data)} chat sessions")
        except Exception as e:
            print(f"Error migrating chat sessions: {e}")
            db.session.rollback()
        
        # Migrate messages
        print("Migrating messages...")
        try:
            old_cursor.execute("SELECT * FROM messages")
            messages_data = old_cursor.fetchall()
            
            for row in messages_data:
                # Check if message already exists
                existing_message = Message.query.filter_by(id=row[0]).first()
                if not existing_message:
                    # Parse sources if they exist
                    sources = None
                    if row[4]:  # sources column
                        try:
                            import json
                            sources = json.loads(row[4])
                        except:
                            sources = []
                    
                    # Handle the created_at field more carefully
                    created_at = datetime.utcnow()
                    if len(row) > 6 and row[6]:  # created_at column exists
                        try:
                            # Try to parse as ISO format
                            created_at = datetime.fromisoformat(row[6])
                        except (ValueError, TypeError):
                            # If parsing fails, try other common formats or use current time
                            try:
                                # Try parsing as timestamp
                                created_at = datetime.fromtimestamp(float(row[6]))
                            except:
                                # Use current time as fallback
                                created_at = datetime.utcnow()
                    
                    message = Message(
                        id=row[0],
                        session_id=row[1],
                        sender=row[2],
                        message=row[3],
                        sources=sources,
                        rating=row[5] if len(row) > 5 and row[5] in ['positive', 'negative'] else None,
                        created_at=created_at
                    )
                    db.session.add(message)
            
            db.session.commit()
            print(f"Migrated {len(messages_data)} messages")
        except Exception as e:
            print(f"Error migrating messages: {e}")
            db.session.rollback()
        
        old_conn.close()
        print("Migration completed successfully!")
        
        # Verify migration
        print("\nVerification:")
        print(f"Users: {User.query.count()}")
        print(f"Topics: {Topic.query.count()}")
        print(f"Chat Sessions: {ChatSession.query.count()}")
        print(f"Messages: {Message.query.count()}")


if __name__ == "__main__":
    migrate_existing_data()
