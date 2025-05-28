"""
Helper utilities for the application.
"""
import os
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def generate_uuid() -> str:
    """Generate a new UUID string."""
    return str(uuid.uuid4())


def get_current_timestamp() -> datetime:
    """Get current UTC timestamp."""
    return datetime.now(timezone.utc)


def format_datetime(dt: datetime) -> str:
    """Format datetime for JSON serialization."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def parse_datetime(dt_string: str) -> datetime:
    """Parse datetime string."""
    return datetime.fromisoformat(dt_string)


def safe_json_loads(json_string: str, default: Any = None) -> Any:
    """Safely parse JSON string with fallback."""
    try:
        return json.loads(json_string) if json_string else default
    except (json.JSONDecodeError, TypeError):
        return default


def safe_json_dumps(data: Any, default: str = "{}") -> str:
    """Safely convert data to JSON string with fallback."""
    try:
        return json.dumps(data) if data is not None else default
    except (TypeError, ValueError):
        return default


def ensure_directory_exists(directory_path: str) -> bool:
    """Ensure directory exists, create if it doesn't."""
    try:
        os.makedirs(directory_path, exist_ok=True)
        return True
    except OSError:
        return False


def get_file_size(file_path: str) -> int:
    """Get file size in bytes."""
    try:
        return os.path.getsize(file_path)
    except OSError:
        return 0


def cleanup_old_files(directory: str, max_age_days: int = 30) -> int:
    """
    Clean up old files in a directory.
    
    Args:
        directory: Directory to clean
        max_age_days: Maximum age in days
        
    Returns:
        Number of files deleted
    """
    if not os.path.exists(directory):
        return 0
    
    deleted_count = 0
    current_time = datetime.now()
    
    try:
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            
            if os.path.isfile(file_path):
                file_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                age_days = (current_time - file_time).days
                
                if age_days > max_age_days:
                    os.remove(file_path)
                    deleted_count += 1
    except OSError:
        pass
    
    return deleted_count


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncate text to specified length."""
    if not text or len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix


def extract_file_extension(filename: str) -> str:
    """Extract file extension from filename."""
    if not filename or '.' not in filename:
        return ""
    
    return filename.rsplit('.', 1)[1].lower()


def is_valid_file_type(filename: str, allowed_extensions: List[str]) -> bool:
    """Check if file type is allowed."""
    extension = extract_file_extension(filename)
    return extension in [ext.lower() for ext in allowed_extensions]


def format_file_size(size_bytes: int) -> str:
    """Format file size in human-readable format."""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"


def build_response(data: Any = None, message: str = None, 
                  success: bool = True, metadata: Dict = None) -> Dict[str, Any]:
    """Build standardized API response."""
    response = {
        "success": success,
        "timestamp": format_datetime(get_current_timestamp())
    }
    
    if data is not None:
        response["data"] = data
    
    if message:
        response["message"] = message
    
    if metadata:
        response["metadata"] = metadata
    
    return response


def paginate_results(items: List[Any], page: int, per_page: int) -> Dict[str, Any]:
    """Paginate a list of items."""
    total_items = len(items)
    total_pages = (total_items + per_page - 1) // per_page
    
    start_index = (page - 1) * per_page
    end_index = start_index + per_page
    
    paginated_items = items[start_index:end_index]
    
    return {
        "items": paginated_items,
        "pagination": {
            "page": page,
            "perPage": per_page,
            "totalItems": total_items,
            "totalPages": total_pages,
            "hasNext": page < total_pages,
            "hasPrev": page > 1
        }
    }


def mask_sensitive_data(data: Dict[str, Any], 
                       sensitive_fields: List[str] = None) -> Dict[str, Any]:
    """Mask sensitive fields in data for logging."""
    if sensitive_fields is None:
        sensitive_fields = ['password', 'password_hash', 'token', 'secret', 'key']
    
    masked_data = data.copy()
    
    for field in sensitive_fields:
        if field in masked_data:
            masked_data[field] = "***masked***"
    
    return masked_data


def generate_session_title(question: str, max_length: int = 50) -> str:
    """Generate a session title from the first question."""
    if not question:
        return f"Chat Session {get_current_timestamp().strftime('%Y-%m-%d %H:%M')}"
    
    # Clean up the question
    title = question.strip()
    
    # Remove question marks and other punctuation from the end
    title = title.rstrip('?!.,;:')
    
    # Truncate if too long
    if len(title) > max_length:
        title = title[:max_length - 3] + "..."
    
    return title if title else "New Chat Session"


def extract_keywords(text: str, max_keywords: int = 5) -> List[str]:
    """Extract keywords from text (simple implementation)."""
    if not text:
        return []
    
    # Simple keyword extraction (in production, you might use more sophisticated NLP)
    import re
    
    # Remove common stop words
    stop_words = {
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in',
        'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this', 'it', 'from',
        'be', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'do', 'does',
        'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might'
    }
    
    # Extract words
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    
    # Filter out stop words and get unique words
    keywords = list(set(word for word in words if word not in stop_words))
    
    # Return first max_keywords
    return keywords[:max_keywords]
