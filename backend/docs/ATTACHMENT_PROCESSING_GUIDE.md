# Attachment Processing Feature

## Overview

The AI Virtual Assistant now supports **file attachments in chat messages**, allowing users to upload documents that provide context for their questions. When a user uploads a file along with their message, the AI will analyze the file content and provide answers based on both the uploaded document and the existing course materials.

## Supported File Types

The system supports the following file formats:

- **PDF**: `.pdf` - Portable Document Format
- **Text**: `.txt`, `.rtf` - Plain text and Rich Text Format
- **Microsoft Word**: `.doc`, `.docx` - Word documents
- **Microsoft Excel**: `.xls`, `.xlsx` - Spreadsheets
- **Microsoft PowerPoint**: `.ppt`, `.pptx` - Presentations
- **CSV**: `.csv` - Comma-separated values

## How It Works

### 1. File Upload Process

When a user sends a message with an attachment:

1. **File Validation**: The system validates the file type and size (max 5MB)
2. **Secure Storage**: Files are stored in session-specific directories
3. **Content Extraction**: Text content is extracted using appropriate processors
4. **Context Creation**: File content is combined with the user's question

### 2. AI Processing

The AI receives an enhanced prompt that includes:

- **User's original question**
- **Complete file content** (or truncated if too long)
- **Clear instructions** to prioritize file content when relevant
- **Course materials context** for comprehensive answers

### 3. Response Generation

The AI provides responses that:

- **Prioritize uploaded file content** when the question is specifically about the file
- **Combine file content with course materials** for comprehensive answers
- **Clearly indicate sources** (file vs course materials)
- **Maintain conversation context** from previous messages

## Technical Implementation

### Backend Components

#### 1. AttachmentProcessor Service (`app/services/attachment_processor.py`)

```python
class AttachmentProcessor:
    """Service for processing different types of file attachments."""
    
    # Key methods:
    - extract_content(file_path, original_filename) -> Dict
    - create_attachment_context(content_data, user_question) -> str
    - is_supported_file(filename) -> bool
```

#### 2. Enhanced QAChainService (`app/services/qa_chain.py`)

```python
# New methods for attachment handling:
- create_qa_chain_with_attachment(retriever, attachment_context=False)
- ask_question_with_attachment(qa_chain, question, attachment_content=None)
```

#### 3. Updated Chat Routes (`app/routes/chat.py`)

The `/chat/message` endpoint now:
- Handles both `multipart/form-data` (with files) and JSON requests
- Processes file attachments using AttachmentProcessor
- Creates attachment-aware QA chains
- Generates context-enhanced AI responses

### File Processing Details

#### Content Extraction Methods

Each file type uses specialized loaders:

- **PDF**: `PyPDFLoader` from LangChain
- **Text**: `TextLoader` with encoding detection
- **Word**: `UnstructuredWordDocumentLoader`
- **Excel**: `UnstructuredExcelLoader`
- **PowerPoint**: `UnstructuredPowerPointLoader`
- **CSV**: Custom pandas-based processor

#### Text Chunking

Large files are split into manageable chunks:
- **Chunk size**: 500 characters
- **Overlap**: 50 characters
- **Maximum chunks**: 10 (to prevent overwhelming the AI)
- **Content limit**: 4000 characters (truncated if longer)

## API Usage

### Request Format

Send a `multipart/form-data` request to `/api/chat/message`:

```javascript
const formData = new FormData();
formData.append('sessionId', sessionId);
formData.append('message', userMessage);
formData.append('attachment', fileObject); // Optional

fetch('/api/chat/message', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Response Format

The response includes attachment information:

```json
{
  "userMessage": {
    "id": "msg_123",
    "message": "What are the key points in this document?",
    "attachment_filename": "report.pdf",
    "attachment_size": 150000,
    "sender": "user",
    "timestamp": "2024-06-14T10:30:00Z"
  },
  "aiMessage": {
    "id": "msg_124",
    "message": "Based on the uploaded report, the key points are...",
    "sources": ["Reference 1: From uploaded file...", "Reference 2: From course materials..."],
    "sender": "assistant",
    "timestamp": "2024-06-14T10:30:05Z"
  },
  "success": true
}
```

## Security Considerations

### File Validation

- **File type checking**: Only allowed extensions accepted
- **File size limits**: Maximum 5MB per file
- **Content scanning**: Files are processed in isolated environment

### Storage Security

- **Session isolation**: Files stored in session-specific directories
- **Automatic cleanup**: Files can be deleted when session ends
- **Secure filenames**: Generated with UUID to prevent conflicts

### Processing Safety

- **Sandboxed execution**: Content extraction in controlled environment
- **Error handling**: Graceful fallback if file processing fails
- **Content limits**: Prevents overwhelming the AI with too much text

## Error Handling

The system gracefully handles various error scenarios:

1. **Unsupported file types**: Clear error message with supported types
2. **File too large**: Size limit notification
3. **Corrupted files**: Processing error with fallback to text-only mode
4. **Processing failures**: AI still responds to text question without file content

## Usage Examples

### Example 1: Document Analysis

**User uploads**: `business_report.pdf`  
**User asks**: "What are the main recommendations in this report?"  
**AI responds**: "Based on the uploaded business report, the main recommendations are: 1) Implement digital transformation... [content from uploaded file] This aligns with the course materials on..."

### Example 2: Data Questions

**User uploads**: `sales_data.xlsx`  
**User asks**: "Can you analyze the trends in this data?"  
**AI responds**: "Looking at the uploaded sales data, I can see the following trends: [analysis based on CSV content]. According to the course materials on data analysis..."

### Example 3: Homework Help

**User uploads**: `assignment.docx`  
**User asks**: "Help me understand this problem"  
**AI responds**: "Based on your uploaded assignment, this problem involves [specific content from document]. Let me explain using the concepts from our course materials..."

## Benefits

1. **Context-Aware Responses**: AI can provide specific answers about uploaded content
2. **Document Analysis**: Users can get insights from their own documents
3. **Homework Assistance**: Upload assignments for targeted help
4. **Research Support**: Analyze uploaded research papers or reports
5. **Data Interpretation**: Upload spreadsheets for data analysis help

## Limitations

1. **File size**: Maximum 5MB per attachment
2. **Processing time**: Large files may take longer to process
3. **Content quality**: OCR accuracy depends on file quality
4. **Language support**: Primarily optimized for English content

## Future Enhancements

1. **Image analysis**: Support for image files with OCR
2. **Multiple files**: Allow multiple attachments per message
3. **File persistence**: Option to keep files for multiple questions
4. **Advanced processing**: Table extraction, chart analysis
5. **Collaboration**: Share processed files between users
