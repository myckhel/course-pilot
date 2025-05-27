"""
Streamlit UI module for the AI Virtual Assistant.
Multi-user interface with topic management and role-based access.
"""
import streamlit as st
import os
import tempfile
from typing import Optional, Dict
from app.document_loader import load_and_split_pdf
from app.vector_store import create_chroma_index_for_topic, load_retriever_for_topic
from app.qa_chain import build_qa_chain
from app.database import (
    authenticate_user, create_user, create_topic, get_all_topics,
    create_chat_session, log_chat_message, get_chat_history,
    get_user_sessions, update_topic_files
)
from app.config import DATABASE_PATH, TOPICS_STORAGE_DIR, VECTOR_STORE_BASE_DIR


def initialize_session_state():
    """Initialize session state variables."""
    if "authenticated" not in st.session_state:
        st.session_state.authenticated = False
    if "user" not in st.session_state:
        st.session_state.user = None
    if "current_topic" not in st.session_state:
        st.session_state.current_topic = None
    if "current_session" not in st.session_state:
        st.session_state.current_session = None
    if "qa_chain" not in st.session_state:
        st.session_state.qa_chain = None


def login_form():
    """Display login form and handle authentication."""
    st.subheader("Login")
    
    with st.form("login_form"):
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")
        submitted = st.form_submit_button("Login")
        
        if submitted and username and password:
            user = authenticate_user(username, password, DATABASE_PATH)
            if user:
                st.session_state.authenticated = True
                st.session_state.user = user
                st.success(f"Welcome, {user['username']}!")
                st.rerun()
            else:
                st.error("Invalid username or password")


def register_form():
    """Display registration form for new users."""
    st.subheader("Register")
    
    with st.form("register_form"):
        username = st.text_input("Choose Username")
        password = st.text_input("Choose Password", type="password")
        confirm_password = st.text_input("Confirm Password", type="password")
        role = st.selectbox("Role", ["student", "admin"])
        submitted = st.form_submit_button("Register")
        
        if submitted and username and password:
            if password != confirm_password:
                st.error("Passwords do not match")
            elif len(password) < 6:
                st.error("Password must be at least 6 characters")
            else:
                if create_user(username, password, role, DATABASE_PATH):
                    st.success("Account created successfully! Please login.")
                else:
                    st.error("Username already exists")


def admin_topic_upload_ui():
    """Admin interface for creating topics and uploading PDFs."""
    st.subheader("Topic Management")
    
    # Topic creation form
    with st.form("create_topic_form"):
        st.write("**Create New Topic**")
        topic_name = st.text_input("Topic Name")
        topic_description = st.text_area("Description")
        uploaded_file = st.file_uploader("Upload PDF Document", type=["pdf"])
        submitted = st.form_submit_button("Create Topic")
        
        if submitted and topic_name and uploaded_file:
            with st.spinner("Creating topic and processing document..."):
                try:
                    # Create topic in database
                    topic_id = create_topic(topic_name, topic_description, 
                                          st.session_state.user['id'], DATABASE_PATH)
                    
                    # Save uploaded PDF
                    pdf_filename = f"topic_{topic_id}_{uploaded_file.name}"
                    pdf_path = os.path.join(TOPICS_STORAGE_DIR, pdf_filename)
                    
                    with open(pdf_path, "wb") as f:
                        f.write(uploaded_file.getvalue())
                    
                    # Process document and create vector store
                    chunks = load_and_split_pdf(pdf_path)
                    vector_store_path = os.path.join(VECTOR_STORE_BASE_DIR, f"topic_{topic_id}")
                    create_chroma_index_for_topic(str(topic_id), chunks, vector_store_path)
                    
                    # Update topic with file paths
                    update_topic_files(topic_id, pdf_filename, vector_store_path, DATABASE_PATH)
                    
                    st.success(f"Topic '{topic_name}' created successfully!")
                    st.rerun()
                    
                except Exception as e:
                    st.error(f"Error creating topic: {str(e)}")
    
    # Display existing topics
    st.write("**Existing Topics**")
    topics = get_all_topics(DATABASE_PATH)
    
    if topics:
        for topic in topics:
            with st.expander(f"📖 {topic['name']}"):
                st.write(f"**Description:** {topic['description']}")
                st.write(f"**Created:** {topic['created_at']}")
                if topic['pdf_filename']:
                    st.write(f"**PDF:** {topic['pdf_filename']}")
                else:
                    st.write("**Status:** No PDF uploaded yet")
    else:
        st.info("No topics created yet.")


def student_qa_ui():
    """Student interface for selecting topics and chatting."""
    st.subheader("Chat with AI Assistant")
    
    # Topic selection
    topics = get_all_topics(DATABASE_PATH)
    
    if not topics:
        st.warning("No topics available yet. Please contact your administrator.")
        return
    
    # Topic selection sidebar
    with st.sidebar:
        st.write("**Select Topic**")
        topic_options = {topic['name']: topic for topic in topics}
        selected_topic_name = st.selectbox(
            "Choose a topic to discuss:",
            options=list(topic_options.keys()),
            index=0 if topic_options else None
        )
        
        selected_topic = topic_options.get(selected_topic_name)
        
        if selected_topic and selected_topic != st.session_state.current_topic:
            st.session_state.current_topic = selected_topic
            st.session_state.current_session = None
            st.session_state.qa_chain = None
        
        # Session management
        if selected_topic:
            st.write("**Sessions**")
            user_sessions = get_user_sessions(
                st.session_state.user['id'], 
                selected_topic['id'], 
                DATABASE_PATH
            )
            
            # New session button
            if st.button("New Session"):
                session_id = create_chat_session(
                    st.session_state.user['id'],
                    selected_topic['id'],
                    db_path=DATABASE_PATH
                )
                st.session_state.current_session = session_id
                st.rerun()
            
            # Existing sessions
            for session in user_sessions:
                if st.button(f" {session['session_name']}", key=f"session_{session['id']}"):
                    st.session_state.current_session = session['id']
                    st.rerun()
    
    # Main chat interface
    if st.session_state.current_topic and st.session_state.current_session:
        topic = st.session_state.current_topic
        
        # Load QA chain if not already loaded
        if not st.session_state.qa_chain:
            try:
                if topic['vector_store_path']:
                    retriever = load_retriever_for_topic(str(topic['id']), topic['vector_store_path'])
                    st.session_state.qa_chain = build_qa_chain(retriever)
                else:
                    st.error("Topic vector store not found. Please contact administrator.")
                    return
            except Exception as e:
                st.error(f"Error loading topic: {str(e)}")
                return
        
        # Display chat history
        chat_history = get_chat_history(st.session_state.current_session, DATABASE_PATH)
        
        st.write(f"**Topic:** {topic['name']}")
        st.write(f"**Description:** {topic['description']}")
        
        # Chat messages container
        chat_container = st.container()
        
        with chat_container:
            for message in chat_history:
                if message['sender'] == 'user':
                    st.chat_message("user").write(message['message'])
                else:
                    st.chat_message("assistant").write(message['message'])
        
        # Chat input
        if prompt := st.chat_input("Ask a question about this topic..."):
            # Display user message
            st.chat_message("user").write(prompt)
            
            # Log user message
            log_chat_message(st.session_state.current_session, 'user', prompt, DATABASE_PATH)
            
            # Get AI response
            with st.chat_message("assistant"):
                with st.spinner("Thinking..."):
                    try:
                        response = st.session_state.qa_chain.run(prompt)
                        st.write(response)
                        
                        # Log assistant response
                        log_chat_message(st.session_state.current_session, 'assistant', response, DATABASE_PATH)
                        
                    except Exception as e:
                        error_msg = f"Sorry, I encountered an error: {str(e)}"
                        st.write(error_msg)
                        log_chat_message(st.session_state.current_session, 'assistant', error_msg, DATABASE_PATH)
    
    else:
        st.info("Select a topic and create or choose a session to start chatting!")


def logout():
    """Handle user logout."""
    st.session_state.authenticated = False
    st.session_state.user = None
    st.session_state.current_topic = None
    st.session_state.current_session = None
    st.session_state.qa_chain = None
    st.rerun()


def run_ui():
    """
    Main Streamlit application with multi-user support.
    """
    # Configure the page
    st.set_page_config(
        page_title="AI Study Assistant", 
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Initialize session state
    initialize_session_state()
    
    # Header
    st.title("AI Virtual Assistant for Students")
    st.markdown("Multi-user topic-based learning assistant")
    
    # Authentication check
    if not st.session_state.authenticated:
        col1, col2 = st.columns(2)
        
        with col1:
            login_form()
        
        with col2:
            register_form()
            
        return
    
    # Main application for authenticated users
    user = st.session_state.user
    
    # Top navigation
    col1, col2, col3 = st.columns([3, 1, 1])
    
    with col1:
        st.write(f"Welcome, **{user['username']}** ({user['role']})")
    
    with col3:
        if st.button("Logout"):
            logout()
    
    # Role-based interface
    if user['role'] == 'admin':
        admin_topic_upload_ui()
        st.divider()
        student_qa_ui()  # Admins can also use student features
    else:
        student_qa_ui()