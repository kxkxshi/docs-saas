# Docs App - Development Setup

## Quick Start (3 minutes)

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend  
npm install
```

### Step 2: Start Backend

```bash
cd backend
python run.py
```

Expected output:
```
INFO:     Application startup complete
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 3: Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v5.0.0 ready in 123 ms
➜ Local:   http://localhost:3000/
```

### Step 4: Open Browser

Navigate to `http://localhost:3000`

Select a demo user and start creating documents!

---

## Running Tests

### Backend Tests

```bash
cd backend
pytest tests/test_api.py -v
```

Expected output:
```
tests/test_api.py::test_create_user PASSED
tests/test_api.py::test_create_document PASSED
tests/test_api.py::test_share_document PASSED
tests/test_api.py::test_api_create_document PASSED
tests/test_api.py::test_api_list_documents PASSED
tests/test_api.py::test_api_authentication_required PASSED

====== 6 passed in 0.45s ======
```

### Frontend Tests (Optional)

```bash
cd frontend
npm run test
```

---

## Docker Deployment

### Build and Run with Docker Compose

```bash
docker-compose up --build
```

This will:
- Build the backend Docker image
- Build the frontend Docker image
- Start both services
- Expose backend on port 8000
- Expose frontend on port 3000

Access at `http://localhost:3000`

---

## Database Management

### Reset Database

```bash
# Stop the app first (Ctrl+C)
rm backend/docs.db
python backend/run.py
```

This recreates the database with seeded demo users.

### View Database

Using SQLite CLI:

```bash
sqlite3 backend/docs.db
.tables          # List tables
.schema users    # View users table
SELECT * FROM users;  # Query users
.quit            # Exit
```

---

## Troubleshooting

### Port Already in Use

**Port 8000 (Backend):**
```bash
# Find what's using port 8000
lsof -i :8000
# Or use a different port
python backend/run.py --port 8001
```

**Port 3000 (Frontend):**
```bash
# Find what's using port 3000
lsof -i :3000
# Or Vite will use next available port
npm run dev
```

### Module Not Found Error

```bash
# Make sure you're in the right directory and venv is activated
cd backend
pip install -r requirements.txt
```

### Frontend Can't Connect to API

1. Ensure backend is running: `curl http://localhost:8000/api/health`
2. Check browser console for errors (F12 → Console tab)
3. Verify CORS is enabled for localhost in `app/main.py`

### Database Lock Error

```bash
# Close any other processes accessing docs.db
# Try restarting the backend
rm backend/docs.db
python backend/run.py
```

### File Upload Not Working

- File must be `.txt` or `.md`
- File must be UTF-8 encoded
- File size must be < 10MB
- Check backend logs for specific error

---

## Development Workflow

### Making Changes

**Frontend:**
- Edit files in `frontend/src/`
- Vite will hot-reload automatically
- Check browser console for errors

**Backend:**
- Edit files in `backend/app/`
- Restart Python process (Ctrl+C, then `python run.py`)
- API will auto-reload with latest changes

### Adding New Feature

Example: Add a "dark mode" toggle

1. Add state in `frontend/src/App.tsx`
2. Add CSS variables for dark mode in `frontend/src/styles.ts`
3. Toggle class on body element
4. Restart dev server

### Git Workflow

```bash
git add .
git commit -m "Add feature description"
git push origin main
```

---

## Production Deployment

### Deploy Backend

#### Option A: Render.com
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect to GitHub repo
4. Set environment: Python 3.11
5. Build command: `pip install -r backend/requirements.txt`
6. Start command: `cd backend && python run.py`

#### Option B: Railway.app
1. Push code to GitHub
2. Create new project on Railway
3. Add backend service
4. Connect to repo, select `/backend` as root directory
5. Set `PYTHON_VERSION=3.11`

### Deploy Frontend

#### Option A: Vercel
```bash
npm i -g vercel
cd frontend
vercel
```

#### Option B: Netlify
1. Connect GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`

### Environment Variables

Create `.env` file in backend root:

```env
DATABASE_URL=postgresql://...  # Use Postgres for production
DEBUG=false
CORS_ORIGINS=https://yourdomain.com
```

---

## Performance Optimization

### Enable Caching

Add to frontend `vite.config.ts`:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', '@tiptap/react']
      }
    }
  }
}
```

### Database Indexing

Add to `backend/app/models.py`:
```python
class Document(Base):
    # ... existing code ...
    __table_args__ = (
        Index('idx_owner_id', 'owner_id'),
        Index('idx_created_at', 'created_at'),
    )
```

### Enable GZIP Compression

Add to `backend/app/main.py`:
```python
from fastapi.middleware.gzip import GZIPMiddleware
app.add_middleware(GZIPMiddleware, minimum_size=1000)
```

---

## FAQ

**Q: Can multiple users edit the same document at the same time?**
A: Not in real-time. If they edit, the last save wins. This is acceptable for the MVP. Real-time collaboration would require WebSockets.

**Q: How do I backup my documents?**
A: Copy `backend/docs.db` file to a safe location.

**Q: Can I use this with PostgreSQL?**
A: Yes! Set `DATABASE_URL=postgresql://user:pass@localhost/docs` and restart.

**Q: How do I add more demo users?**
A: Edit the `DEMO_USERS` dict in `backend/app/auth.py` and restart the backend.

**Q: Can I deploy this on AWS?**
A: Yes, use Lambda for backend + S3 for static frontend, or EC2 for simpler deployment.

---

## Support

For detailed architecture notes, see `ARCHITECTURE.md`

For API documentation, see `README.md`
