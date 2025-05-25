#!/usr/bin/env python3
"""
Test script to verify the complete Phase 1 implementation workflow.
This script tests database operations, user management, and topic creation.
"""

import os
import sys
from app.database import (
    setup_sqlite_database, create_user, authenticate_user,
    create_topic, get_all_topics, create_chat_session,
    log_chat_message, get_chat_history
)
from app.config import DATABASE_PATH

def test_phase_1_workflow():
    """Test the complete Phase 1 workflow."""
    print("🧪 Testing Phase 1 Implementation")
    print("=" * 50)
    
    # Test 1: Database Setup
    print("\n1. Testing Database Setup...")
    try:
        setup_sqlite_database(DATABASE_PATH)
        print("✅ Database setup successful")
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return False
    
    # Test 2: User Creation
    print("\n2. Testing User Management...")
    try:
        # Create a test student
        result = create_user("test_student", "password123", "student", DATABASE_PATH)
        if result:
            print("✅ Student user created successfully")
        else:
            print("ℹ️ Student user already exists (expected if running multiple times)")
        
        # Test authentication
        user = authenticate_user("admin", "admin123", DATABASE_PATH)
        if user and user['role'] == 'admin':
            print("✅ Admin authentication successful")
        else:
            print("❌ Admin authentication failed")
            return False
            
        user = authenticate_user("test_student", "password123", DATABASE_PATH)
        if user and user['role'] == 'student':
            print("✅ Student authentication successful")
        else:
            print("❌ Student authentication failed")
            return False
            
    except Exception as e:
        print(f"❌ User management failed: {e}")
        return False
    
    # Test 3: Topic Management
    print("\n3. Testing Topic Management...")
    try:
        # Get admin user for topic creation
        admin_user = authenticate_user("admin", "admin123", DATABASE_PATH)
        
        # Create a test topic
        topic_id = create_topic(
            "Test AI Course", 
            "A test topic for validating the system", 
            admin_user['id'], 
            DATABASE_PATH
        )
        print(f"✅ Topic created with ID: {topic_id}")
        
        # Get all topics
        topics = get_all_topics(DATABASE_PATH)
        print(f"✅ Retrieved {len(topics)} topics from database")
        
        # Find our test topic
        test_topic = None
        for topic in topics:
            if topic['name'] == "Test AI Course":
                test_topic = topic
                break
        
        if test_topic:
            print("✅ Test topic found in database")
        else:
            print("❌ Test topic not found")
            return False
            
    except Exception as e:
        print(f"❌ Topic management failed: {e}")
        return False
    
    # Test 4: Chat Session Management
    print("\n4. Testing Chat Session Management...")
    try:
        # Get student user
        student_user = authenticate_user("test_student", "password123", DATABASE_PATH)
        
        # Create a chat session
        session_id = create_chat_session(
            student_user['id'], 
            test_topic['id'], 
            "Test Session", 
            DATABASE_PATH
        )
        print(f"✅ Chat session created with ID: {session_id}")
        
        # Log some test messages
        log_chat_message(session_id, "user", "What is artificial intelligence?", DATABASE_PATH)
        log_chat_message(session_id, "assistant", "AI is a field of computer science...", DATABASE_PATH)
        print("✅ Chat messages logged successfully")
        
        # Retrieve chat history
        history = get_chat_history(session_id, DATABASE_PATH)
        if len(history) == 2:
            print(f"✅ Chat history retrieved: {len(history)} messages")
        else:
            print(f"❌ Expected 2 messages, got {len(history)}")
            return False
            
    except Exception as e:
        print(f"❌ Chat session management failed: {e}")
        return False
    
    # Test 5: File Structure
    print("\n5. Testing File Structure...")
    try:
        required_dirs = ["topics_storage", "vector_stores"]
        for dir_name in required_dirs:
            if os.path.exists(dir_name):
                print(f"✅ Directory exists: {dir_name}")
            else:
                print(f"❌ Missing directory: {dir_name}")
                return False
                
        if os.path.exists(DATABASE_PATH):
            print(f"✅ Database file exists: {DATABASE_PATH}")
        else:
            print(f"❌ Missing database file: {DATABASE_PATH}")
            return False
            
    except Exception as e:
        print(f"❌ File structure test failed: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 All Phase 1 tests passed successfully!")
    print("\n📋 Phase 1 Implementation Summary:")
    print("✅ Multi-user authentication system")
    print("✅ Role-based access control (admin/student)")
    print("✅ Topic management with database persistence")
    print("✅ Chat session management")
    print("✅ Message history storage")
    print("✅ File system organization")
    print("✅ Database schema and operations")
    
    print("\n🚀 Ready for Phase 2: Document Processing & AI Integration")
    return True

if __name__ == "__main__":
    success = test_phase_1_workflow()
    sys.exit(0 if success else 1)
