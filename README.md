# Docs App - Full Stack Collaborative Document Editor

A lightweight, full-stack document collaboration application with rich-text editing, file upload, and simple sharing capabilities.

## Features

✅ **Document Management**
- Create, edit, rename, and delete documents
- Rich-text editing with formatting (bold, italic, underline, headings, lists)
- Auto-save capability
- Document versioning via timestamps

✅ **File Upload**
- Import .txt, .md, and .docx files as new documents
- Automatic content preservation and formatting recognition
- File validation and error handling

✅ **Document Sharing**
- Share documents with other users
- Owner-based access control
- View-only access for shared recipients
- Revoke sharing at any time

✅ **Multi-User Support**
- Seeded demo accounts (alice, bob, charlie)
- Simple user switching
- Ownership and sharing visibility

✅ **Persistence**
- SQLite database (embedded, no external service required)
- All documents and sharing relationships persisted
- Automatic schema creation on startup

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript, Vite, TipTap (rich-text editor), Lucide (icons) |
| **Backend** | Python 3.8+, FastAPI, SQLAlchemy ORM |
| **Database** | SQLite 3 |
| **Deployment** | Docker (optional), or direct Python/Node execution |

## Quick Start

### Prerequisites
- Python 3.8+ with pip
- Node.js 16+ with npm
- Git (optional)

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python run.py
```

The backend will start on `http://localhost:8000`

Check the API health: `http://localhost:8000/api/health`

### 2. Frontend Setup (New Terminal)

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`

### 3. Start Using the App

1. Open `http://localhost:3000` in your browser
2. Select a demo user: **alice**, **bob**, or **charlie**
3. Create a new document or upload a .txt/.md file
4. Invite other users by sharing documents

## Quick Actions Guide

| Action | How |
|--------|-----|
| Create a document | Click "New Doc" button in sidebar |
| Edit document | Click title to rename, type in editor to edit content |
| Save changes | Auto-saves after edits; manual "Save" button if needed |
| Upload file | Click "Upload" button, select .txt, .md, or .docx file |
| Share document | Click "Share" button, select user, click Share |
| Revoke sharing | Open Share modal, click "Revoke" next to user |
| Delete document | Click trash icon next to document in list (owner only) |
| Switch user | Click "Logout" top-right, select different user |
| View shared docs | Shared documents appear in sidebar with "Shared" badge |

## Project Structure

```
docs-app/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app and routes
│   │   ├── models.py         # SQLAlchemy models (User, Document)
│   │   ├── schemas.py        # Pydantic schemas for validation
│   │   ├── database.py       # Database configuration
│   │   ├── crud.py           # CRUD operations
│   │   └── auth.py           # Auth middleware and utilities
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_api.py       # Comprehensive API tests
│   ├── requirements.txt
│   └── run.py                # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx          # React entry point
│   │   ├── App.tsx           # Main app component
│   │   ├── api.ts            # API client and types
│   │   ├── styles.ts         # All CSS styling
│   │   ├── RichTextEditor.tsx # TipTap editor component
│   │   ├── Editor.tsx        # Document editor page
│   │   └── Sidebar.tsx       # Document sidebar
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── README.md
└── ARCHITECTURE.md
```

## API Endpoints

### Authentication
- `GET /api/auth/users` - List all users
- `GET /api/auth/me` - Get current user info (requires `x-user-id` header)

### Documents (requires `x-user-id` header)
- `POST /api/documents` - Create new document
- `GET /api/documents` - List user's documents (owned + shared)
- `GET /api/documents/{id}` - Get document detail
- `PUT /api/documents/{id}` - Update document (owner only)
- `DELETE /api/documents/{id}` - Delete document (owner only)

### File Upload (requires `x-user-id` header)
- `POST /api/documents/upload/file` - Upload .txt or .md file

### Sharing (requires `x-user-id` header, owner only)
- `POST /api/documents/{id}/share` - Share document with user
- `DELETE /api/documents/{id}/share/{user_id}` - Revoke sharing

### Health
- `GET /api/health` - Health check

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username VARCHAR UNIQUE,
  email VARCHAR UNIQUE
);
```

### Documents Table
```sql
CREATE TABLE documents (
  id INTEGER PRIMARY KEY,
  title VARCHAR,
  content TEXT,
  owner_id INTEGER FOREIGN KEY,
  created_at DATETIME,
  updated_at DATETIME
);
```

### Document Sharing (M2M)
```sql
CREATE TABLE document_shares (
  document_id INTEGER FOREIGN KEY,
  user_id INTEGER FOREIGN KEY,
  PRIMARY KEY (document_id, user_id)
);
```

## Testing

Run backend tests:

```bash
cd backend
pytest tests/test_api.py -v
```

Tests cover:
- User creation
- Document CRUD operations
- Document sharing
- API authentication
- Error handling

## Features & Scope Decisions

### What We Built (MVP Scope)
1. ✅ Core document CRUD with persistent SQLite storage
2. ✅ Rich-text editing (bold, italic, underline, 3 heading levels, 2 list types)
3. ✅ File upload for .txt and .md files
4. ✅ Simple sharing model with owner-based access control
5. ✅ Multi-user support with demo accounts
6. ✅ Auto-save and manual save with visual feedback
7. ✅ Clean, responsive UI with minimal dependencies

### Intentional Scope Cuts (Why)
- **No real authentication**: Seeded demo accounts keep scope focused on product features, not auth infrastructure
- **No advanced collaboration**: No real-time co-editing or conflict resolution; one-user-at-a-time is coherent MVP
- **Limited rich-text features**: Core formatting only; no tables, code blocks, or embedded media
- **SQLite only**: No need for managed database service; file-based persistence is reliable and deployable
- **No image uploads**: Adds complexity without core value for document editing
- **No export/download**: Can add post-MVP if needed

## Error Handling

All API errors return structured JSON with appropriate HTTP status codes:

```json
{
  "detail": "Error message here"
}
```

Status codes used:
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Not authenticated
- `403` - Forbidden (access denied)
- `404` - Not found
- `500` - Server error

## Deployment Options

### Option 1: Local Docker (Optional)
```bash
docker-compose up
```

### Option 2: Direct Deployment
Push `backend/` to any Python-capable platform (Render, Heroku, Railway) and `frontend/` to Vercel or Netlify.

### Option 3: Single VPS
Deploy both backend and frontend on same server with reverse proxy (Nginx).

## Performance Notes

- Document content is stored as HTML (TipTap format)
- No pagination implemented (suitable for < 1000 documents per user)
- Database queries are indexed on owner_id and document_id
- Frontend caches document list in state; refresh to see other users' changes

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers supported with responsive UI

## Known Limitations

1. **No real-time sync**: Changes only sync when page is refreshed or document is reopened by other users
2. **No conflict resolution**: If multiple users edit simultaneously, last save wins
3. **Limited formatting**: Custom styles and advanced formatting not supported
4. **No mentions/comments**: Collaboration is via sharing only
5. **No email notifications**: Sharing is silent; users must check sidebar

## Future Enhancements

- [ ] Real-time collaborative editing with WebSockets
- [ ] User presence indicators
- [ ] Change history / version control
- [ ] Rich media attachments
- [ ] PDF export
- [ ] Markdown export
- [ ] Dark mode
- [ ] Full-text search
- [ ] Document templates
- [ ] Role-based access (editor/viewer/commenter)

## Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
lsof -i :8000
# Try different port
DATABASE_URL=sqlite:///./docs.db python run.py --port 8001
```

### Frontend can't connect to API
- Ensure backend is running on `http://localhost:8000`
- Check browser console for CORS errors
- Verify `x-user-id` header is being sent

### Database locked error
```bash
# Delete the database and restart
rm backend/docs.db
python backend/run.py
```

### Upload fails
- File must be .txt or .md
- File must be UTF-8 encoded text
- File must be < 10MB (practical limit)

## Support

For issues or questions, check the ARCHITECTURE.md file for design details and AI usage notes.

## License

MIT
