"""
Streamlit UI module for the AI Virtual Assistant.
Provides interface for uploading documents and asking questions.
"""
import streamlit as st
from app.document_loader import load_and_split_pdf
from app.vector_store import create_vector_store, load_retriever
from app.qa_chain import build_qa_chain
import tempfile
import os


def run_ui():
    """
    Streamlit front-end: handles document upload, Q&A input/output.
    """
    # Configure the page
    st.set_page_config(page_title="AI Study Assistant", layout="centered")
    st.title("📘 AI Virtual Assistant for Students")
    st.markdown("""
    Upload your lecture notes or study materials as PDF, then ask questions to get instant answers!
    """)
    
    # Initialize session state for storing the QA chain
    if "qa_chain" not in st.session_state:
        st.session_state.qa_chain = None

    # File uploader component
    uploaded_file = st.file_uploader("Upload Lecture PDF", type=["pdf"])
    
    # Process uploaded file
    if uploaded_file:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(uploaded_file.getvalue())
            tmp_path = tmp.name
        st.success("PDF uploaded successfully!")

        with st.spinner("Processing document..."):
            # Load and split the document
            chunks = load_and_split_pdf(tmp_path)
            
            # Create vector store and retriever
            create_vector_store(chunks)
            retriever = load_retriever()
            
            # Build QA chain and store in session state
            st.session_state.qa_chain = build_qa_chain(retriever)
            st.success("Document indexed. Ask your questions!")
            
            # Clean up temporary file
            os.unlink(tmp_path)
    
    # Question input and answering
    if st.session_state.qa_chain:
        # Add a divider for visual separation
        st.divider()
        st.subheader("Ask a Question")
        
        # Question input
        query = st.text_input("Type your question about the document:")
        
        # Process question when submitted
        if query:
            with st.spinner("Thinking..."):
                # Get answer from QA chain
                answer = st.session_state.qa_chain.run(query)
                
                # Display the answer
                st.markdown("### Answer")
                st.markdown(answer)
    
    # Display help information when no document is loaded
    else:
        st.info("👆 Upload a document to get started!")