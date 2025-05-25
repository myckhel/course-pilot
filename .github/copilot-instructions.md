## 📘 Project Overview:

### **AI Virtual Assistant for Student Q\&A Using LangChain**

This project is a **lightweight AI-powered assistant** designed to enhance the **learning experience of students in higher education**. Users can ask questions in natural language based on uploaded study materials (PDFs), and receive intelligent, context-aware answers directly sourced from the selected topic.

Built with **LangChain**, **Chroma**, and **OpenAI**, the system leverages large language models and a retrieval-augmented generation (RAG) architecture to provide accurate, conversational answers through a minimal Streamlit interface.

The assistant supports:

- Ingesting and indexing lecture PDFs using **Chroma** for efficient semantic search.
- Real-time Q\&A powered by OpenAI’s GPT model.
- Streamlit UI for easy interaction.

> Ideal for test prep, revision, or flipped classroom models.

## ✅ Objectives:

- Boost **student engagement** and **comprehension**.
- Provide an always-available **academic Q\&A tool**.
- Demonstrate RAG with **LangChain + Chroma + OpenAI**.

## ✅ Benefits:

- **Quick development** using modern LLM tooling.
- **Runs locally**—just Python, internet, and a laptop.
- Ideal for **2-week hackathons, demos, or prototypes**.

## ✅ **1. Project Structure (Clean Architecture)**

```
app/
│   ├── __init__.py
│   ├── config.py
│   ├── document_loader.py      # PDF loader and text chunking
│   ├── vector_store.py         # Chroma embedding & retrieval
│   ├── qa_chain.py             # LangChain QA chain setup
│   └── ui.py                   # Streamlit UI
│
├── main.py                     # App entrypoint
├── requirements.txt
├── .env                        # API keys
└── README.md
```

## ✅ **2. Key Features (Updated Scope)**

- **Admin topic creation and PDF upload**
- **Student topic selection and Q\&A**
- **SQLite database** for managing users and chat sessions
- Continued use of **LangChain**, **Chroma**, and **OpenAI**

## ✅ **Enhanced Copilot Prompt Instructions (Updated Project Scope)**

```python
# Load a PDF file and split it into chunks
def load_and_split_pdf(file_path: str, chunk_size: int = 500, overlap: int = 50):
    """
    Uses LangChain’s CharacterTextSplitter to cleanly split text
    from a PDF document into semantically meaningful chunks.
    Suitable for embedding and retrieval.
    """
    ...

# Embed document chunks into Chroma vector store under a given topic
def create_chroma_index_for_topic(topic_id: str, chunks: list, persist_directory: str):
    """
    Creates and stores embeddings for a topic’s study material using Chroma.
    Persists embeddings to a topic-specific directory.
    """
    ...

# Load retriever for a specific topic
def load_retriever_for_topic(topic_id: str, persist_directory: str):
    """
    Loads a retriever from the Chroma vector store for the given topic.
    Returns a retriever suitable for passing into LangChain RetrievalQA.
    """
    ...

# Build a RetrievalQA chain with the loaded retriever
def build_qa_chain(retriever):
    """
    Builds a RetrievalQA pipeline using OpenAI’s LLM and the provided retriever.
    Suitable for answering questions with citations from the indexed study material.
    """
    ...

# Initialize and manage SQLite DB for users and chat sessions
def setup_sqlite_database(db_path: str = "assistant.db"):
    """
    Sets up SQLite database tables:
    - Users (id, name, role)
    - Topics (id, name, description)
    - ChatSessions (id, user_id, topic_id, timestamp)
    - Messages (id, session_id, sender, message, timestamp)
    """
    ...

# Record each message exchanged in a chat session
def log_chat_message(session_id: int, sender: str, message: str, db_path: str):
    """
    Inserts a user or assistant message into the messages table for persistence.
    """
    ...

# Get chat history for a session
def get_chat_history(session_id: int, db_path: str):
    """
    Retrieves the full chat history for a given session.
    Useful for rendering conversations in UI.
    """
    ...

# Streamlit: Admin uploads study material, creates a topic
def admin_topic_upload_ui():
    """
    Streamlit UI for admins to:
    - Enter topic metadata
    - Upload a PDF
    - Trigger indexing and persistence
    """
    ...

# Streamlit: Student selects a topic and chats with assistant
def student_qa_ui():
    """
    Streamlit UI for students to:
    - Log in / select topic
    - Ask questions
    - Receive intelligent responses
    - View session history
    """
    ...
```

### ✅ Responsibilities Breakdown

| Feature          | Responsibility                           | Implemented By                    |
| ---------------- | ---------------------------------------- | --------------------------------- |
| **PDF Parsing**  | Break PDF into clean text chunks         | `load_and_split_pdf()`            |
| **Vector Store** | Embed & store by topic ID                | `create_chroma_index_for_topic()` |
| **LLM Chain**    | Ask topic-specific questions             | `build_qa_chain()`                |
| **Admin Portal** | Create topic, upload study material      | `admin_topic_upload_ui()`         |
| **Student UI**   | Select topic, ask questions              | `student_qa_ui()`                 |
| **SQLite DB**    | Manage users, topics, sessions, messages | `setup_sqlite_database()`         |

## ✅ **3. Requirements (Latest Packages)**

```txt
langchain>=0.1.0
openai>=1.10.0
chromadb>=0.4.24
pypdf>=3.15.0
streamlit>=1.30.0
python-dotenv>=1.0.0
```

## ✅ **4. LangChain + Chroma + OpenAI Integration**

**`document_loader.py`**

```python
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter

def load_and_split_pdf(file_path, chunk_size=500, chunk_overlap=50):
    loader = PyPDFLoader(file_path)
    pages = loader.load()
    splitter = CharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return splitter.split_documents(pages)
```

**`vector_store.py`**

```python
from langchain.vectorstores import Chroma
from langchain.embeddings.openai import OpenAIEmbeddings

PERSIST_DIR = "chroma_db"

def create_chroma_index(chunks, persist_directory=PERSIST_DIR):
    embeddings = OpenAIEmbeddings()
    vectorstore = Chroma.from_documents(documents=chunks, embedding=embeddings, persist_directory=persist_directory)
    vectorstore.persist()

def load_chroma_retriever(persist_directory=PERSIST_DIR):
    embeddings = OpenAIEmbeddings()
    vectorstore = Chroma(persist_directory=persist_directory, embedding_function=embeddings)
    return vectorstore.as_retriever()
```

**`qa_chain.py`**

```python
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI

def build_qa_chain(retriever):
    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
    return RetrievalQA.from_chain_type(llm=llm, retriever=retriever)
```

## ✅ **5. Streamlit UI**

**`ui.py`**

```python
import streamlit as st
from app.document_loader import load_and_split_pdf
from app.vector_store import create_chroma_index, load_chroma_retriever
from app.qa_chain import build_qa_chain
import tempfile

def run_ui():
    st.set_page_config(page_title="AI Study Assistant", layout="centered")
    st.title("📘 AI Virtual Assistant for Students")

    if "qa_chain" not in st.session_state:
        st.session_state.qa_chain = None

    uploaded_file = st.file_uploader("Upload Lecture PDF", type=["pdf"])
    if uploaded_file:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(uploaded_file.getvalue())
            tmp_path = tmp.name
        st.success("PDF uploaded successfully!")

        with st.spinner("Processing document..."):
            chunks = load_and_split_pdf(tmp_path)
            create_chroma_index(chunks)
            retriever = load_chroma_retriever()
            st.session_state.qa_chain = build_qa_chain(retriever)
            st.success("Document indexed. Ask your questions!")

    if st.session_state.qa_chain:
        query = st.text_input("Ask a question about the document:")
        if query:
            answer = st.session_state.qa_chain.run(query)
            st.markdown(f"**Answer:** {answer}")
```

## ✅ **6. Environment Variables**

`.env`:

```
OPENAI_API_KEY=sk-xxxxxxx
```

In `config.py` or `main.py`:

```python
from dotenv import load_dotenv
import os

load_dotenv()
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")
```

## ✅ **7. Run the App**

```bash
streamlit run main.py
```

**`main.py`**

```python
from app.ui import run_ui
from app import config  # Loads .env

if __name__ == "__main__":
    run_ui()
```
