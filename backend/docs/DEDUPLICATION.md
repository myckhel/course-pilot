# Document Deduplication System

This system prevents duplicate documents from being added to the vector store using multiple strategies.

## How It Works

### 1. Multiple Deduplication Strategies

The system uses three levels of duplicate detection:

1. **File Hash (SHA-256)**: Detects identical files
2. **Content Hash (SHA-256)**: Detects files with identical extracted content
3. **Filename + Topic**: Prevents same filename in same topic

### 2. Document Tracking

Each uploaded document is tracked in the `documents` table with:

- `file_hash`: SHA-256 hash of the original file
- `content_hash`: SHA-256 hash of the extracted text content
- `filename`: Stored filename
- `original_filename`: Original uploaded filename
- `topic_id`: Associated topic
- `is_processed`: Whether the document was successfully processed
- `chunk_count`: Number of chunks created in vector store

### 3. Deduplication Process

When a document is uploaded:

1. **Pre-processing Check**: Calculate file hash and check if it already exists
2. **Content Extraction**: Extract content and calculate content hash
3. **Content Duplicate Check**: Check if same content already exists
4. **Vector Store Update**: Only add to vector store if not duplicate
5. **Database Record**: Create document record for tracking

## Usage

### Setup with Deduplication

Run the setup script - it will automatically check for duplicates:

```bash
python setup.py
```

### Check for Duplicates

Analyze existing documents for duplicates:

```bash
# Analyze only (dry run)
python check_duplicates.py

# Show detailed analysis
python check_duplicates.py --analyze-only

# Actually clean up duplicates
python check_duplicates.py --clean
```

### Manual Duplicate Check

From your application code:

```python
from app.services.document_service import DocumentService
from app.services.vector_store import VectorStoreService

doc_service = DocumentService()
vector_service = VectorStoreService('chroma_db')

# Check if document is already processed
is_duplicate, existing_doc = doc_service.is_document_already_processed(
    file_path="/path/to/document.pdf",
    topic_id="topic-uuid"
)

if is_duplicate:
    print(f"Document already exists: {existing_doc.original_filename}")
else:
    # Process the document
    success, message, chunk_count = vector_service.create_topic_index_with_deduplication(
        topic_id="topic-uuid",
        file_path="/path/to/document.pdf",
        original_filename="document.pdf",
        uploaded_by="user-uuid"
    )
```

## Benefits

1. **Prevents Duplicate Processing**: Saves computational resources
2. **Maintains Vector Store Integrity**: No duplicate embeddings
3. **Accurate Document Counts**: Real-time tracking of processed documents
4. **Storage Efficiency**: Prevents duplicate file storage
5. **User Feedback**: Clear messages about why a document wasn't processed

## Migration

If you have an existing system, run the migration:

```bash
python migrate_documents.py
```

This will:
- Create the `documents` table
- Sync existing topic document counts
- Prepare the system for deduplication

## Vector Store Consistency

The system ensures consistency between:
- Database document records
- Vector store collections
- Topic document counts

Use the analysis tool to verify consistency:

```bash
python check_duplicates.py --analyze-only
```

## Error Handling

The system gracefully handles:
- File read errors
- Content extraction failures
- Hash calculation errors
- Database transaction failures
- Vector store creation errors

If duplicate checking fails, the system defaults to allowing the upload to ensure availability.

## Best Practices

1. **Regular Analysis**: Run duplicate analysis periodically
2. **Monitor Logs**: Check for duplicate detection messages
3. **Backup Before Cleanup**: Always backup before running cleanup
4. **Test Duplicates**: Upload same document to verify detection works
5. **Content Hashing**: Useful for detecting renamed duplicates

## Troubleshooting

### High Document Counts

If document counts seem high:

```bash
python check_duplicates.py --analyze-only
```

Look for mismatches between DB count and recorded count.

### Missing Vector Stores

If documents exist in DB but not in vector store:

1. Check the vector store directory permissions
2. Verify ChromaDB is accessible
3. Re-process the documents

### Performance Issues

If duplicate checking is slow:

1. Ensure database indexes are created
2. Consider batch processing for large uploads
3. Monitor hash calculation performance

## Technical Details

### Hash Calculation

- **File Hash**: Calculated on raw file bytes
- **Content Hash**: Calculated on extracted text content
- **Chunk Size**: 4KB blocks for file reading

### Database Indexes

The system creates indexes on:
- `file_hash` column for fast file duplicate lookup
- `content_hash` column for fast content duplicate lookup
- `topic_id` + `original_filename` for filename checks

### Vector Store Organization

Each topic has its own vector store directory:
```
chroma_db/
├── topic-uuid-1/
├── topic-uuid-2/
└── ...
```

This allows for topic-specific duplicate checking and easier cleanup.
