## ✅ **Development Plan (2 Weeks)**

### **Week 1: Core System Implementation**

#### 📅 **Day 1–2: Project Setup & Environment**
- Set up Python project environment
- Install dependencies: `langchain`, `faiss-cpu`, `openai`, `pypdf`, `streamlit`, etc.
- Generate OpenAI API key and configure `.env`

#### 📅 **Day 3–4: Document Upload & Parsing**
- Create Streamlit file upload component for PDF
- Use `PyPDFLoader` or `PDFPlumber` to read and extract text from the uploaded document
- Split text into chunks using LangChain’s `TextSplitter`

#### 📅 **Day 5: Embedding & Vector Store**
- Generate embeddings for chunks using `OpenAIEmbeddings`
- Store and index them in **FAISS**
- Save the vector store to disk for reuse during question answering

---

### **Week 2: Q&A and UI Integration**

#### 📅 **Day 6–7: Question Answering Logic**
- Build LangChain retriever to fetch relevant chunks from FAISS
- Use `LLMChain` or `RetrievalQA` with OpenAI model to generate responses
- Test with simple question inputs and check accuracy of responses

#### 📅 **Day 8–9: Streamlit Chat Interface**
- Design basic chat interface in Streamlit (text input, display area)
- Connect input box to the Q&A logic to show results in real-time

#### 📅 **Day 10: Cleanup & Improvements**
- Handle basic error cases (e.g., empty uploads, long prompts)
- Add option to reset chat or re-upload a new document

#### 📅 **Day 11–12: Final Testing**
- Manually test different documents and questions
- Ensure the app runs smoothly with no crashes or bugs

#### 📅 **Day 13–14: Documentation & Submission Prep**
- Write a concise README with:
  - Project overview
  - Setup instructions
  - Usage guide with screenshots
- Create a short demo video (optional, for presentation)
- Package project for final submission or upload to GitHub

---

## 🧰 **Tools Checklist**

| Tool/Library   | Purpose                          |
| -------------- | -------------------------------- |
| **LangChain**  | Chaining loaders, retriever, LLM |
| **FAISS**      | Vector search over embeddings    |
| **OpenAI API** | LLM for intelligent Q&A          |
| **Streamlit**  | Simple, fast frontend UI         |
| **PyPDF**      | Parsing uploaded documents       |

---

## 📌 **Optional Enhancements (Post-Project)**
- Add support for multiple documents
- Highlight matched document chunks in UI
- Store past questions and answers
