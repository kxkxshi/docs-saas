from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session
import io
import os
from pathlib import Path
from html import escape
from datetime import datetime, timedelta

from docx import Document as DocxDocument

from app.database import engine, get_db, Base
from app import crud, schemas, auth, models

# Create tables
Base.metadata.create_all(bind=engine)


def ensure_runtime_schema():
    with engine.begin() as connection:
        existing_tables = connection.exec_driver_sql(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()
        table_names = {row[0] for row in existing_tables}

        if "document_shares" in table_names:
            share_columns = connection.exec_driver_sql("PRAGMA table_info(document_shares)").fetchall()
            column_names = {row[1] for row in share_columns}
            if "role" not in column_names:
                connection.exec_driver_sql(
                    "ALTER TABLE document_shares ADD COLUMN role VARCHAR NOT NULL DEFAULT 'viewer'"
                )


ensure_runtime_schema()

app = FastAPI(title="Docs App", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


PRESENCE_TTL_SECONDS = 20
DOCUMENT_PRESENCE: dict[int, dict[int, datetime]] = {}


def role_for_share(db: Session, doc_id: int, user_id: int):
    return crud.get_document_share_role(db, doc_id, user_id)


def serialize_shared_users(db: Session, doc: models.Document):
    shared_users = []
    for user in doc.shared_with_users:
        shared_users.append(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": role_for_share(db, doc.id, user.id) or "viewer",
            }
        )
    return shared_users


def serialize_versions(versions):
    return [
        {
            "id": version.id,
            "document_id": version.document_id,
            "version_number": version.version_number,
            "title": version.title,
            "content": version.content,
            "created_by_id": version.created_by_id,
            "created_at": version.created_at,
        }
        for version in versions
    ]


def serialize_comments(comments):
    return [
        {
            "id": comment.id,
            "document_id": comment.document_id,
            "author_id": comment.author_id,
            "body": comment.body,
            "snippet": comment.snippet or "",
            "kind": comment.kind,
            "is_resolved": comment.is_resolved,
            "created_at": comment.created_at,
            "author": {
                "id": comment.author.id,
                "username": comment.author.username,
                "email": comment.author.email,
            },
        }
        for comment in comments
    ]


def cleanup_presence(doc_id: int):
    now = datetime.utcnow()
    active = DOCUMENT_PRESENCE.get(doc_id, {})
    DOCUMENT_PRESENCE[doc_id] = {
        user_id: seen_at
        for user_id, seen_at in active.items()
        if (now - seen_at).total_seconds() <= PRESENCE_TTL_SECONDS
    }


def build_collaboration_payload(db: Session, doc: models.Document, current_user: models.User):
    cleanup_presence(doc.id)
    active_entries = DOCUMENT_PRESENCE.get(doc.id, {})
    active_collaborators = []

    known_users = {doc.owner_id: doc.owner}
    for shared_user in doc.shared_with_users:
        known_users[shared_user.id] = shared_user

    for user_id, seen_at in active_entries.items():
        user = known_users.get(user_id) or crud.get_user(db, user_id)
        if not user:
            continue
        active_collaborators.append(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": "owner" if user.id == doc.owner_id else (role_for_share(db, doc.id, user.id) or "viewer"),
                "last_seen_at": seen_at,
                "is_active": True,
            }
        )

    return {
        "document_id": doc.id,
        "access_role": "owner" if doc.owner_id == current_user.id else (role_for_share(db, doc.id, current_user.id) or "viewer"),
        "shared_with_users": serialize_shared_users(db, doc),
        "active_collaborators": active_collaborators,
        "version_count": len(doc.versions),
        "comment_count": len(doc.comments),
    }


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
            "permission_role": "owner",
            "shared_with_users": serialize_shared_users(db, doc)
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
                "permission_role": role_for_share(db, doc.id, current_user.id) or "viewer",
                "shared_with_users": serialize_shared_users(db, doc)
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
    
    auth.check_document_access(current_user.id, doc, db=db)

    current_role = "owner" if doc.owner_id == current_user.id else (role_for_share(db, doc.id, current_user.id) or "viewer")
    
    return {
        "id": doc.id,
        "title": doc.title,
        "content": doc.content,
        "owner_id": doc.owner_id,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
        "is_owner": doc.owner_id == current_user.id,
        "permission_role": current_role,
        "shared_with_users": serialize_shared_users(db, doc)
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
    
    if not crud.user_has_permission(db, doc, current_user.id, "editor"):
        raise HTTPException(status_code=403, detail="Only editors can edit this document")
    
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
    payload: schemas.ShareRequest,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Share document with another user"""
    doc = crud.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can share this document")
    
    target_user = crud.get_user(db, payload.user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if payload.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot share with yourself")
    
    crud.share_document(db, doc_id, payload.user_id, payload.role)
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


@app.get("/api/documents/{doc_id}/collaboration")
def get_collaboration_state(
    doc_id: int,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    doc = crud.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    auth.check_document_access(current_user.id, doc, db=db)
    return build_collaboration_payload(db, doc, current_user)


@app.post("/api/documents/{doc_id}/presence")
def ping_presence(
    doc_id: int,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    doc = crud.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    auth.check_document_access(current_user.id, doc, db=db)
    DOCUMENT_PRESENCE.setdefault(doc.id, {})[current_user.id] = datetime.utcnow()
    return build_collaboration_payload(db, doc, current_user)


@app.get("/api/documents/{doc_id}/presence")
def get_presence(
    doc_id: int,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    doc = crud.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    auth.check_document_access(current_user.id, doc, db=db)
    return build_collaboration_payload(db, doc, current_user)


@app.get("/api/documents/{doc_id}/versions")
def list_versions(
    doc_id: int,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    doc = crud.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    auth.check_document_access(current_user.id, doc, db=db)
    return serialize_versions(crud.list_document_versions(db, doc_id))


@app.post("/api/documents/{doc_id}/versions/{version_id}/restore")
def restore_version(
    doc_id: int,
    version_id: int,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    doc = crud.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can restore versions")

    restored_doc = crud.restore_document_version(db, doc_id, version_id)
    if not restored_doc:
        raise HTTPException(status_code=404, detail="Version not found")

    return {
        "id": restored_doc.id,
        "title": restored_doc.title,
        "content": restored_doc.content,
        "owner_id": restored_doc.owner_id,
        "created_at": restored_doc.created_at,
        "updated_at": restored_doc.updated_at,
        "is_owner": True,
        "permission_role": "owner",
        "shared_with_users": serialize_shared_users(db, restored_doc)
    }


@app.get("/api/documents/{doc_id}/comments")
def list_comments(
    doc_id: int,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    doc = crud.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    auth.check_document_access(current_user.id, doc, db=db)
    return serialize_comments(crud.list_document_comments(db, doc_id))


@app.post("/api/documents/{doc_id}/comments")
def create_comment(
    doc_id: int,
    payload: schemas.CommentCreate,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    doc = crud.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    auth.check_document_access(current_user.id, doc, required_role="commenter", db=db)
    comment = crud.create_document_comment(
        db,
        doc_id,
        current_user.id,
        payload.body,
        payload.snippet or "",
        payload.kind,
    )
    return serialize_comments([comment])[0]


@app.patch("/api/comments/{comment_id}")
def update_comment(
    comment_id: int,
    payload: schemas.CommentUpdate,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    comment = db.query(models.DocumentComment).filter(models.DocumentComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    doc = crud.get_document(db, comment.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.owner_id != current_user.id and comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the author or owner can update this comment")

    updated_comment = crud.update_document_comment_resolved(db, comment_id, payload.is_resolved)
    return serialize_comments([updated_comment])[0]


@app.get("/api/documents/{doc_id}/export/markdown")
def export_markdown(
    doc_id: int,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    doc = crud.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    auth.check_document_access(current_user.id, doc, db=db)
    markdown = _html_to_markdown(doc.content)
    filename = f"{Path(doc.title).stem or 'document'}.md"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=markdown, media_type="text/markdown", headers=headers)


def _html_to_markdown(html_content: str):
    from html.parser import HTMLParser

    class MarkdownBuilder(HTMLParser):
        def __init__(self):
            super().__init__()
            self.parts = []
            self.current_text = []
            self.list_stack = []

        def handle_starttag(self, tag, attrs):
            if tag in {"p", "div"}:
                self.current_text.append("")
            elif tag == "br":
                self.current_text.append("\n")
            elif tag in {"h1", "h2", "h3"}:
                self.current_text.append("#" * int(tag[1]) + " ")
            elif tag in {"strong", "b"}:
                self.current_text.append("**")
            elif tag in {"em", "i"}:
                self.current_text.append("*")
            elif tag == "ul":
                self.list_stack.append("ul")
            elif tag == "ol":
                self.list_stack.append("ol")
            elif tag == "li":
                prefix = "- " if not self.list_stack or self.list_stack[-1] == "ul" else "1. "
                self.current_text.append(prefix)

        def handle_endtag(self, tag):
            if tag in {"strong", "b"}:
                self.current_text.append("**")
            elif tag in {"em", "i"}:
                self.current_text.append("*")
            elif tag in {"p", "div", "h1", "h2", "h3", "li"}:
                text = "".join(self.current_text).strip()
                if text:
                    self.parts.append(text)
                    self.parts.append("")
                self.current_text = []
            elif tag in {"ul", "ol"} and self.list_stack:
                self.list_stack.pop()

        def handle_data(self, data):
            self.current_text.append(data)

    parser = MarkdownBuilder()
    parser.feed(html_content or "")
    if parser.current_text:
        tail = "".join(parser.current_text).strip()
        if tail:
            parser.parts.append(tail)
    return "\n".join(part for part in parser.parts if part is not None).strip() or "# Document\n"


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
