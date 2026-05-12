from sqlalchemy.orm import Session
from app import models, schemas


ROLE_ORDER = {
    "viewer": 0,
    "commenter": 1,
    "editor": 2,
}


# User CRUD
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(username=user.username, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# Document CRUD
def create_document(db: Session, doc: schemas.DocumentCreate, owner_id: int):
    db_doc = models.Document(**doc.dict(), owner_id=owner_id)
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    create_document_version(db, db_doc.id, owner_id)
    return db_doc


def get_document(db: Session, doc_id: int):
    return db.query(models.Document).filter(models.Document.id == doc_id).first()


def get_user_documents(db: Session, user_id: int):
    """Get documents owned by user and documents shared with user"""
    owned = db.query(models.Document).filter(models.Document.owner_id == user_id).all()
    shared = db.query(models.Document).filter(
        models.Document.shared_with_users.any(models.User.id == user_id)
    ).all()
    return owned, shared


def get_document_share_role(db: Session, doc_id: int, user_id: int):
    result = db.execute(
        models.document_shares.select().where(
            models.document_shares.c.document_id == doc_id,
            models.document_shares.c.user_id == user_id,
        )
    ).first()
    if not result:
        return None
    return result.role or "viewer"


def get_document_permission_role(db: Session, doc: models.Document, user_id: int):
    if doc.owner_id == user_id:
        return "owner"

    role = get_document_share_role(db, doc.id, user_id)
    return role or None


def user_has_permission(db: Session, doc: models.Document, user_id: int, required_role: str = "viewer"):
    role = get_document_permission_role(db, doc, user_id)
    if role is None:
        return False
    if role == "owner":
        return True

    return ROLE_ORDER.get(role, 0) >= ROLE_ORDER.get(required_role, 0)


def update_document(db: Session, doc_id: int, doc_update: schemas.DocumentUpdate):
    db_doc = get_document(db, doc_id)
    if db_doc:
        update_data = doc_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_doc, key, value)
        db.commit()
        db.refresh(db_doc)
        create_document_version(db, db_doc.id, db_doc.owner_id)
    return db_doc


def delete_document(db: Session, doc_id: int):
    db_doc = get_document(db, doc_id)
    if db_doc:
        db.delete(db_doc)
        db.commit()
    return db_doc


def share_document(db: Session, doc_id: int, user_id: int, role: str = "viewer"):
    """Share a document with a user"""
    db_doc = get_document(db, doc_id)
    if db_doc:
        target_user = get_user(db, user_id)
        if target_user:
            existing_role = get_document_share_role(db, doc_id, user_id)
            if existing_role is None:
                db.execute(
                    models.document_shares.insert().values(
                        document_id=doc_id,
                        user_id=user_id,
                        role=role,
                    )
                )
            else:
                db.execute(
                    models.document_shares.update().where(
                        models.document_shares.c.document_id == doc_id,
                        models.document_shares.c.user_id == user_id,
                    ).values(role=role)
                )
            db.commit()
            db.refresh(db_doc)
    return db_doc


def unshare_document(db: Session, doc_id: int, user_id: int):
    """Remove sharing access for a document"""
    db_doc = get_document(db, doc_id)
    if db_doc:
        db.execute(
            models.document_shares.delete().where(
                models.document_shares.c.document_id == doc_id,
                models.document_shares.c.user_id == user_id,
            )
        )
        db.commit()
        db.refresh(db_doc)
    return db_doc


def list_document_versions(db: Session, doc_id: int):
    return (
        db.query(models.DocumentVersion)
        .filter(models.DocumentVersion.document_id == doc_id)
        .order_by(models.DocumentVersion.version_number.desc())
        .all()
    )


def create_document_version(db: Session, doc_id: int, created_by_id: int):
    db_doc = get_document(db, doc_id)
    if not db_doc:
        return None

    version_count = (
        db.query(models.DocumentVersion)
        .filter(models.DocumentVersion.document_id == doc_id)
        .count()
    )
    version = models.DocumentVersion(
        document_id=doc_id,
        version_number=version_count + 1,
        title=db_doc.title,
        content=db_doc.content,
        created_by_id=created_by_id,
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


def restore_document_version(db: Session, doc_id: int, version_id: int):
    db_doc = get_document(db, doc_id)
    if not db_doc:
        return None

    version = (
        db.query(models.DocumentVersion)
        .filter(
            models.DocumentVersion.id == version_id,
            models.DocumentVersion.document_id == doc_id,
        )
        .first()
    )
    if not version:
        return None

    db_doc.title = version.title
    db_doc.content = version.content
    db.commit()
    db.refresh(db_doc)
    create_document_version(db, doc_id, db_doc.owner_id)
    return db_doc


def list_document_comments(db: Session, doc_id: int):
    return (
        db.query(models.DocumentComment)
        .filter(models.DocumentComment.document_id == doc_id)
        .order_by(models.DocumentComment.created_at.asc())
        .all()
    )


def create_document_comment(
    db: Session,
    doc_id: int,
    author_id: int,
    body: str,
    snippet: str = "",
    kind: str = "comment",
):
    comment = models.DocumentComment(
        document_id=doc_id,
        author_id=author_id,
        body=body,
        snippet=snippet or "",
        kind=kind,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def update_document_comment_resolved(db: Session, comment_id: int, is_resolved: bool):
    comment = db.query(models.DocumentComment).filter(models.DocumentComment.id == comment_id).first()
    if not comment:
        return None

    comment.is_resolved = is_resolved
    db.commit()
    db.refresh(comment)
    return comment
