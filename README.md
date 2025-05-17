# AI Virtual Assistant for Student Q&A

A lightweight AI-powered assistant designed to enhance the learning experience of students in higher education. This tool enables students to upload lecture notes in PDF format and ask questions in natural language, receiving intelligent, context-aware answers extracted directly from their study materials.

## Features

- Upload lecture PDFs and process them for question answering
- Ask questions in natural language about the uploaded material
- Receive accurate, conversational answers from the AI

## Technology Stack

- **LangChain**: Framework for developing applications powered by language models
- **ChromaDB**: Efficient similarity search and vector storage
- **OpenAI**: GPT model for natural language processing
- **Streamlit**: Simple web interface for interaction
- **PyPDF**: PDF parsing utility

## Setup Instructions

1. Clone this repository
2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=sk-your-api-key
   ```
   Note: The .env file is ignored by git to protect your API keys.
5. Run the application:
   ```
   source venv/bin/activate && streamlit run main.py
   ```

## Usage

1. Launch the application
2. Upload a PDF containing lecture notes or study materials
3. Wait for the application to process the document
4. Ask questions about the material in the text input box
5. Receive AI-generated answers based on the content of your document
6. Q list the output devices and their numbers in the order it was listed

## Version Control & .gitignore

This project includes a `.gitignore` file that prevents sensitive information and large generated files from being committed to version control:

- **`.env` file** - Contains API keys that should never be committed
- **`chroma_db/` directory** - Contains vector database files that can be regenerated
- **Virtual environment directories** - Such as `venv/` or `env/`
- **`__pycache__/` and other Python cache files** - To keep the repository clean
- **`.pdf` files** - Sample or uploaded documents used for testing
- **OS-specific files** - Like `.DS_Store` on macOS

When contributing to this project, ensure you don't manually bypass these exclusions to maintain security.

## Project Structure

```
── app/
│   ├── __init__.py
│   ├── config.py           # Environment configuration
│   ├── document_loader.py  # PDF handling and text chunking
│   ├── vector_store.py     # ChromaDB embedding & retrieval
│   ├── qa_chain.py         # LangChain QA logic
│   └── ui.py               # Streamlit interface
│
├── main.py                 # Entry point
├── requirements.txt
├── .env                    # API key storage
├── .gitignore              # Version control exclusions
└── README.md
```