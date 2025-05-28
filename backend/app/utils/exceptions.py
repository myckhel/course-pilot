"""
Custom exceptions for the application.
"""


class BaseAppException(Exception):
    """Base exception class for the application."""
    
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class ValidationError(BaseAppException):
    """Exception raised for validation errors."""
    
    def __init__(self, message: str, field: str = None):
        self.field = field
        super().__init__(message, "VALIDATION_ERROR")


class AuthenticationError(BaseAppException):
    """Exception raised for authentication errors."""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, "AUTHENTICATION_ERROR")


class AuthorizationError(BaseAppException):
    """Exception raised for authorization errors."""
    
    def __init__(self, message: str = "Access denied"):
        super().__init__(message, "AUTHORIZATION_ERROR")


class ResourceNotFoundError(BaseAppException):
    """Exception raised when a resource is not found."""
    
    def __init__(self, message: str, resource_type: str = None):
        self.resource_type = resource_type
        super().__init__(message, "RESOURCE_NOT_FOUND")


class DatabaseError(BaseAppException):
    """Exception raised for database errors."""
    
    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, "DATABASE_ERROR")


class FileUploadError(BaseAppException):
    """Exception raised for file upload errors."""
    
    def __init__(self, message: str = "File upload failed"):
        super().__init__(message, "FILE_UPLOAD_ERROR")


class DocumentProcessingError(BaseAppException):
    """Exception raised for document processing errors."""
    
    def __init__(self, message: str = "Document processing failed"):
        super().__init__(message, "DOCUMENT_PROCESSING_ERROR")


class VectorStoreError(BaseAppException):
    """Exception raised for vector store operations errors."""
    
    def __init__(self, message: str = "Vector store operation failed"):
        super().__init__(message, "VECTOR_STORE_ERROR")


class QAChainError(BaseAppException):
    """Exception raised for QA chain errors."""
    
    def __init__(self, message: str = "QA chain operation failed"):
        super().__init__(message, "QA_CHAIN_ERROR")


class ConfigurationError(BaseAppException):
    """Exception raised for configuration errors."""
    
    def __init__(self, message: str = "Configuration error"):
        super().__init__(message, "CONFIGURATION_ERROR")


class RateLimitError(BaseAppException):
    """Exception raised when rate limits are exceeded."""
    
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, "RATE_LIMIT_ERROR")


class ExternalServiceError(BaseAppException):
    """Exception raised for external service errors (e.g., OpenAI API)."""
    
    def __init__(self, message: str = "External service error", service_name: str = None):
        self.service_name = service_name
        super().__init__(message, "EXTERNAL_SERVICE_ERROR")
