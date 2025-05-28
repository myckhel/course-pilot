"""
Utilities module for the AI Teaching Assistant backend.
"""
from .validators import (
    validate_email,
    validate_password,
    validate_topic_name,
    validate_file_size,
    validate_uuid,
    sanitize_filename,
    validate_json_data,
    validate_pagination_params
)

from .exceptions import (
    BaseAppException,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    ResourceNotFoundError,
    DatabaseError,
    FileUploadError,
    DocumentProcessingError,
    VectorStoreError,
    QAChainError,
    ConfigurationError,
    RateLimitError,
    ExternalServiceError
)

from .helpers import (
    generate_uuid,
    get_current_timestamp,
    format_datetime,
    parse_datetime,
    safe_json_loads,
    safe_json_dumps,
    ensure_directory_exists,
    get_file_size,
    cleanup_old_files,
    truncate_text,
    extract_file_extension,
    is_valid_file_type,
    format_file_size,
    build_response,
    paginate_results,
    mask_sensitive_data,
    generate_session_title,
    extract_keywords
)

__all__ = [
    # Validators
    'validate_email',
    'validate_password', 
    'validate_topic_name',
    'validate_file_size',
    'validate_uuid',
    'sanitize_filename',
    'validate_json_data',
    'validate_pagination_params',
    
    # Exceptions
    'BaseAppException',
    'ValidationError',
    'AuthenticationError',
    'AuthorizationError',
    'ResourceNotFoundError',
    'DatabaseError',
    'FileUploadError',
    'DocumentProcessingError',
    'VectorStoreError',
    'QAChainError',
    'ConfigurationError',
    'RateLimitError',
    'ExternalServiceError',
    
    # Helpers
    'generate_uuid',
    'get_current_timestamp',
    'format_datetime',
    'parse_datetime',
    'safe_json_loads',
    'safe_json_dumps',
    'ensure_directory_exists',
    'get_file_size',
    'cleanup_old_files',
    'truncate_text',
    'extract_file_extension',
    'is_valid_file_type',
    'format_file_size',
    'build_response',
    'paginate_results',
    'mask_sensitive_data',
    'generate_session_title',
    'extract_keywords'
]
