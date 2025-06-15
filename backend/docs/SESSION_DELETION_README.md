# Session Deletion Implementation

## Overview

This implementation provides complete session deletion functionality that ensures all resources linked to a chat session are properly cleaned up. It also includes enhanced user deletion that properly handles all associated sessions and attachments.

## What Gets Deleted

### Individual Session Deletion

When a chat session is deleted, the following resources are cleaned up:

1. **Database Records:**
   - All messages in the session
   - The chat session record itself

2. **File System Resources:**
   - Individual attachment files referenced by messages
   - Session directory (if it exists)
   - Any remaining files in the session directory

### User Deletion (Enhanced)

When a user is deleted (admin action), the following resources are cleaned up:

1. **Database Records:**
   - All chat sessions belonging to the user
   - All messages in those sessions
   - All topics created by the user
   - The user record itself

2. **File System Resources:**
   - All attachment files from all user sessions
   - All session directories for the user
   - Any orphaned files in user session directories

## Implementation Details

### Database Service (`app/services/database.py`)

- **`delete_chat_session(session_id)`**: Deletes session and all its messages from the database
- **`get_session_attachment_paths(session_id)`**: Retrieves all attachment file paths before deletion
- **`delete_user_sessions_with_cleanup(user_id, file_service)`**: Enhanced bulk session deletion with file cleanup
- **`delete_user(user_id)`**: Standard user deletion (database only)

### Chat Routes (`app/routes/chat.py`)

- **`DELETE /api/chat/sessions/<session_id>`**: Complete session deletion endpoint

### Admin Routes (`app/routes/admin.py`)

- **`DELETE /api/admin/users/<user_id>`**: Enhanced user deletion with complete cleanup

### Security Features

1. **Authentication Required**: JWT token required for all deletion operations
2. **Authorization Check**: Only session owner can delete sessions; only admins can delete users
3. **Session/User Validation**: Verifies existence before deletion
4. **Self-Protection**: Admins cannot delete their own accounts

### Error Handling

- Returns appropriate HTTP status codes (404, 403, 500)
- Handles database transaction rollbacks
- Logs warnings for file cleanup issues
- Continues deletion even if some files can't be removed
- Provides warnings when file cleanup is incomplete

## API Endpoints

### Session Deletion

```
DELETE /api/chat/sessions/{session_id}
Authorization: Bearer {jwt_token}
```

### User Deletion (Admin Only)

```
DELETE /api/admin/users/{user_id}
Authorization: Bearer {admin_jwt_token}
```

### Response Examples

**Success (200):**
```json
{
  "message": "Chat session deleted successfully",
  "sessionId": "session-uuid"
}
```

**User Deletion Success (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Success with warning (200):**
```json
{
  "message": "Session deleted successfully",
  "sessionId": "session-uuid",
  "warning": "Session deleted but some attachment files could not be removed"
}
```

**Error Responses:**
- `404`: Session/User not found
- `403`: Access denied (not session owner / not admin)
- `401`: Unauthorized (no valid JWT)
- `400`: Cannot delete own admin account
- `500`: Server error during deletion

## Cleanup Process

### Session Deletion Process

1. **Authentication**: Verify JWT token
2. **Authorization**: Verify user owns session
3. **Pre-deletion**: Get all attachment file paths
4. **Database**: Delete messages and session (with transaction)
5. **Files**: Remove individual attachment files
6. **Directory**: Clean up session directory
7. **Response**: Return success/warning based on cleanup results

### User Deletion Process

1. **Authentication**: Verify admin JWT token
2. **Authorization**: Verify admin role and not self-deletion
3. **Pre-deletion**: Get all user sessions and their attachments
4. **File Cleanup**: Remove all session files and directories
5. **Database**: Delete all sessions, messages, topics, and user
6. **Response**: Return success/warning based on cleanup results

## Testing

A comprehensive test script (`test_session_deletion.py`) is provided that tests:

- Complete session deletion workflow
- Unauthorized access protection
- Non-existent session handling
- Attachment file cleanup
- Database record removal verification
- User deletion scenarios

### Running Tests

```bash
cd backend
python test_session_deletion.py
```

**Prerequisites:**
- Backend server running
- Test user account created
- Topics with documents available

## Dependencies

- **FileUploadService**: For attachment file management
- **DatabaseService**: For database operations
- **Flask-JWT-Extended**: For authentication
- **SQLAlchemy**: For database transactions

## File Structure

```
backend/
├── app/
│   ├── routes/
│   │   ├── chat.py          # Session deletion endpoint
│   │   └── admin.py         # Enhanced user deletion
│   ├── services/
│   │   └── database.py      # Enhanced deletion methods
│   └── utils/
│       └── file_upload.py   # File cleanup utilities
├── test_session_deletion.py # Comprehensive test suite
└── SESSION_DELETION_README.md # This documentation
```

## Notes

- File cleanup errors don't block database deletion
- All database operations are transactional
- Session directory cleanup removes any orphaned files
- Deletion operations are idempotent (safe to call multiple times)
- User deletion cascades to all owned resources
- Comprehensive logging for troubleshooting
- Graceful degradation when file operations fail
