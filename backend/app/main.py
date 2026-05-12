from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import io
import os
from pathlib import Path
from html import escape

from docx import Document as DocxDocument

from app.database import engine, get_db, Base
from app import crud, schemas, auth, models

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Docs App", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Seed demo users on startup
@app.on_event("startup")
def seed_demo_users():
    db = next(get_db())
    try:
        # Create demo users if they don't exist
        demo_users = [
            {"username": "alice", "email": "alice@example.com"},
            {"username": "bob", "email": "bob@example.com"},
            {"username": "charlie", "email": "charlie@example.com"},
        ]
        
        for user_data in demo_users:
            existing = crud.get_user_by_username(db, user_data["username"])
            if not existing:
                crud.create_user(db, schemas.UserCreate(**user_data))
    finally:
        db.close()


# Auth Routes
@app.get("/api/auth/users")
def list_users(db: Session = Depends(get_db)):
    """List all available demo users"""
    users = db.query(models.User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email
        } for u in users
    ]


@app.get("/api/auth/me")
def get_current_user_info(
    current_user = Depends(auth.get_current_user)
):
    """Get current user info"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }


# Document Routes
@app.post("/api/documents")
def create_document(
    doc: schemas.DocumentCreate,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new document"""
    return crud.create_document(db, doc, current_user.id)


@app.get("/api/documents")
def list_documents(
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """List all documents (owned and shared)"""
    owned, shared = crud.get_user_documents(db, current_user.id)
    
    result = []
    for doc in owned:
        result.append({
            "id": doc.id,
            "title": doc.title,
            "owner_id": doc.owner_id,
            "created_at": doc.created_at,
            "updated_at": doc.updated_at,
            "is_owner": True,
            "is_shared": False,
            "shared_with_users": [{"id": u.id, "username": u.username} for u in doc.shared_with_users]
        })
    
    for doc in shared:
        if doc not in owned:  # Avoid duplicates
            result.append({
                "id": doc.id,
                "title": doc.title,
                "owner_id": doc.owner_id,
                "created_at": doc.created_at,
                "updated_at": doc.updated_at,
                "is_owner": False,
                "is_shared": True,
                "shared_with_users": [{"id": u.id, "username": u.username} for u in doc.shared_with_users]
            })
    
    return result


@app.get("/api/documents/{doc_id}")
def get_document(
    doc_id: int,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get document by ID"""
    doc = crud.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    auth.check_document_access(current_user.id, doc)
    
    return {
        "id": doc.id,
        "title": doc.title,
        "content": doc.content,
        "owner_id": doc.owner_id,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
        "is_owner": doc.owner_id == current_user.id,
        "shared_with_users": [{"id": u.id, "username": u.username} for u in doc.shared_with_users]
    }


@app.put("/api/documents/{doc_id}")
def update_document(
    doc_id: int,
    doc_update: schemas.DocumentUpdate,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update document (title or content)"""
    doc = crud.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Only owner can edit
    if doc.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can edit this document")
    
    return crud.update_document(db, doc_id, doc_update)


@app.delete("/api/documents/{doc_id}")
def delete_document(
    doc_id: int,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete document (owner only)"""
    doc = crud.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can delete this document")
    
    crud.delete_document(db, doc_id)
    return {"detail": "Document deleted"}


# Sharing Routes
@app.post("/api/documents/{doc_id}/share")
def share_document(
    doc_id: int,
    user_id: int,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Share document with another user"""
    doc = crud.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can share this document")
    
    target_user = crud.get_user(db, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot share with yourself")
    
    crud.share_document(db, doc_id, user_id)
    return {"detail": "Document shared successfully"}


@app.delete("/api/documents/{doc_id}/share/{user_id}")
def unshare_document(
    doc_id: int,
    user_id: int,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Remove sharing access for a document"""
    doc = crud.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can unshare this document")
    
    crud.unshare_document(db, doc_id, user_id)
    return {"detail": "Sharing removed successfully"}


# File Upload
@app.post("/api/documents/upload/file")
async def upload_file(
    file: UploadFile = File(...),
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a .txt, .md, or .docx file and create a document from it"""
    
    # Validate file type
    allowed_types = {".txt", ".md", ".docx"}
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Read file content
    content = await file.read()
    if file_ext == ".docx":
        try:
            docx_file = DocxDocument(io.BytesIO(content))
            html_parts = []
            for paragraph in docx_file.paragraphs:
                text = paragraph.text.strip()
                if not text:
                    continue

                style_name = (paragraph.style.name or "").lower() if paragraph.style else ""
                if style_name.startswith("heading 1"):
                    html_parts.append(f"<h1>{escape(text)}</h1>")
                elif style_name.startswith("heading 2"):
                    html_parts.append(f"<h2>{escape(text)}</h2>")
                elif style_name.startswith("heading 3"):
                    html_parts.append(f"<h3>{escape(text)}</h3>")
                else:
                    html_parts.append(f"<p>{escape(text)}</p>")

            if not html_parts:
                html_parts.append("<p></p>")

            content_str = "\n".join(html_parts)
        except Exception:
            raise HTTPException(status_code=400, detail="Unable to read the .docx file")
    else:
        try:
            content_str = content.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File must be UTF-8 encoded text")
    
    # Create document from file
    doc_title = Path(file.filename).stem  # filename without extension
    doc = schemas.DocumentCreate(
        title=doc_title,
        content=content_str
    )
    
    created_doc = crud.create_document(db, doc, current_user.id)
    
    return {
        "id": created_doc.id,
        "title": created_doc.title,
        "content": created_doc.content,
        "owner_id": created_doc.owner_id,
        "created_at": created_doc.created_at,
        "updated_at": created_doc.updated_at
    }


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
