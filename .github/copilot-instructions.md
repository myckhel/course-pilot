## 📘 Project Overview:

### **AI Virtual Assistant for Student Q&A Using LangChain**

This project is a **lightweight AI-powered assistant** designed to enhance the **learning experience of students in higher education**. It enables students to upload lecture notes and ask questions in natural language, receiving intelligent, context-aware answers extracted directly from their study materials. Built with **LangChain**, **FAISS**, and **OpenAI**, the system leverages large language models to provide accurate, conversational answers in a streamlined interface.

The assistant supports:

- Ingesting and indexing lecture PDFs using FAISS for efficient semantic search.
- Real-time question-answering using OpenAI’s GPT model.
- A minimal Streamlit UI for accessible student interaction.

> Ideal for use cases like test preparation, self-guided revision, or flipping the classroom.

---

### ✅ Objectives:

- Improve **student engagement** and **understanding** of lecture content.
- Provide a **self-service academic Q&A tool** without teacher intervention.
- Showcase applied AI concepts like **retrieval-augmented generation** (RAG) using LangChain.

---

### ✅ Benefits:

- **Fast development** using modern AI tools and APIs.
- **No complex infrastructure**—runs on a laptop with Python and internet.
- Perfect fit for **2-week student research/demo projects**.

## ✅ **1. Project Structure (Clean Architecture)**

```

── app/
│   ├── __init__.py
│   ├── config.py
│   ├── document_loader.py      # Handles PDF uploads and chunking
│   ├── vector_store.py         # FAISS embedding & retrieval logic
│   ├── qa_chain.py             # LangChain LLM chain setup
│   └── ui.py                   # Streamlit UI
│
├── main.py                     # Entry point
├── requirements.txt
├── .env                        # For API keys
└── README.md
```

---

## ✅ **2. Copilot Prompt Instructions (for Effective Code Generation)**

Use comments and docstrings like these to get accurate, context-aware Copilot suggestions:

```python
# Load a PDF file and split it into clean, non-overlapping chunks
def load_and_split_pdf(file_path: str, chunk_size: int = 500, overlap: int = 50):
    """
    Uses PyPDFLoader and LangChain's CharacterTextSplitter
    to extract text and chunk it intelligently.
    """
    ...

# Embed chunks using OpenAI embeddings and store in FAISS
def create_faiss_index(chunks: list[str], faiss_path: str):
    """
    Create and persist a FAISS vector store from given document chunks.
    """
    ...

# Load FAISS index and prepare retriever
def load_faiss_retriever(faiss_path: str):
    """
    Loads FAISS index and returns retriever for semantic search.
    """
    ...

# Build a QA chain using OpenAI and LangChain
def build_qa_chain(retriever):
    """
    Build a RetrievalQA chain with OpenAI LLM and the provided retriever.
    """
    ...

# Streamlit interface: Upload file, ask question, display answer
def run_ui():
    """
    Streamlit front-end: handles document upload, Q&A input/output.
    """
    ...
```

---

## ✅ **3. Requirements (Best Practice Dependencies)**

```txt
langchain>=0.1.0
openai>=1.10.0
faiss-cpu>=1.7.4
pypdf>=3.15.0
streamlit>=1.30.0
python-dotenv>=1.0.0
```

---

## ✅ **4. LangChain + FAISS + OpenAI (Senior-Level Usage)**

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
from langchain.vectorstores import FAISS
from langchain.embeddings.openai import OpenAIEmbeddings
import os

def create_faiss_index(chunks, path="faiss_index"):
    embeddings = OpenAIEmbeddings()
    vectorstore = FAISS.from_documents(chunks, embeddings)
    vectorstore.save_local(path)

def load_faiss_retriever(path="faiss_index"):
    embeddings = OpenAIEmbeddings()
    vectorstore = FAISS.load_local(path, embeddings, allow_dangerous_deserialization=True)
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

---

## ✅ **5. Streamlit Frontend (Production-Friendly)**

**`ui.py`**

```python
import streamlit as st
from app.document_loader import load_and_split_pdf
from app.vector_store import create_faiss_index, load_faiss_retriever
from app.qa_chain import build_qa_chain
import tempfile
import os

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
            create_faiss_index(chunks)
            retriever = load_faiss_retriever()
            st.session_state.qa_chain = build_qa_chain(retriever)
            st.success("Document indexed. Ask your questions!")

    if st.session_state.qa_chain:
        query = st.text_input("Ask a question about the document:")
        if query:
            answer = st.session_state.qa_chain.run(query)
            st.markdown(f"**Answer:** {answer}")
```

---

## ✅ **6. Environment Variables**

Create a `.env` file in root:

```
OPENAI_API_KEY=sk-xxxxx
```

In `config.py` or `main.py`:

```python
from dotenv import load_dotenv
import os

load_dotenv()
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")
```

---

## ✅ **7. Run the App**

```bash
streamlit run main.py
```

**`main.py`**

```python
from app.ui import run_ui
from app import config  # Ensures dotenv loads early

if __name__ == "__main__":
    run_ui()
```

---

Would you like this zipped into a ready-to-run template or pushed to a GitHub repo template for download?
