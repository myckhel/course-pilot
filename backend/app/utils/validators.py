"""
Validation utilities for the application.
"""
import re
from typing import Any


def validate_email(email: str) -> bool:
    """
    Validate email format.
    
    Args:
        email: Email address to validate
        
    Returns:
        True if email is valid, False otherwise
    """
    if not email or not isinstance(email, str):
        return False
    
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_pattern, email.strip()) is not None


def validate_password(password: str) -> bool:
    """
    Validate password strength.
    
    Args:
        password: Password to validate
        
    Returns:
        True if password meets requirements, False otherwise
    """
    if not password or not isinstance(password, str):
        return False
    
    # Minimum 8 characters
    if len(password) < 8:
        return False
    
    # For now, just check length. In production, you might want:
    # - At least one uppercase letter
    # - At least one lowercase letter
    # - At least one digit
    # - At least one special character
    
    return True


def validate_topic_name(name: str) -> bool:
    """
    Validate topic name.
    
    Args:
        name: Topic name to validate
        
    Returns:
        True if name is valid, False otherwise
    """
    if not name or not isinstance(name, str):
        return False
    
    name = name.strip()
    
    # Check length
    if len(name) < 3 or len(name) > 100:
        return False
    
    # Check for valid characters (letters, numbers, spaces, hyphens, underscores)
    if not re.match(r'^[a-zA-Z0-9\s\-_]+$', name):
        return False
    
    return True


def validate_file_size(file_size: int, max_size_mb: int = 16) -> bool:
    """
    Validate file size.
    
    Args:
        file_size: File size in bytes
        max_size_mb: Maximum allowed size in MB
        
    Returns:
        True if file size is valid, False otherwise
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    return 0 < file_size <= max_size_bytes


def validate_uuid(uuid_string: str) -> bool:
    """
    Validate UUID format.
    
    Args:
        uuid_string: UUID string to validate
        
    Returns:
        True if UUID is valid, False otherwise
    """
    if not uuid_string or not isinstance(uuid_string, str):
        return False
    
    uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    return re.match(uuid_pattern, uuid_string.lower()) is not None


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe storage.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    if not filename:
        return "untitled"
    
    # Remove path separators and dangerous characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    
    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:250] + ('.' + ext if ext else '')
    
    return filename


def validate_json_data(data: Any, required_fields: list) -> tuple[bool, str]:
    """
    Validate JSON data has required fields.
    
    Args:
        data: JSON data to validate
        required_fields: List of required field names
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not isinstance(data, dict):
        return False, "Invalid JSON data format"
    
    missing_fields = [field for field in required_fields if field not in data]
    
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    
    return True, ""


def validate_pagination_params(page: str, per_page: str) -> tuple[int, int, str]:
    """
    Validate and convert pagination parameters.
    
    Args:
        page: Page number as string
        per_page: Items per page as string
        
    Returns:
        Tuple of (page_int, per_page_int, error_message)
    """
    try:
        page_int = int(page) if page else 1
        per_page_int = int(per_page) if per_page else 10
        
        if page_int < 1:
            return 1, per_page_int, "Page number must be positive"
        
        if per_page_int < 1 or per_page_int > 100:
            return page_int, 10, "Items per page must be between 1 and 100"
        
        return page_int, per_page_int, ""
        
    except ValueError:
        return 1, 10, "Invalid pagination parameters"
