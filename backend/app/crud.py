from sqlalchemy.orm import Session
from app import models, schemas


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


def update_document(db: Session, doc_id: int, doc_update: schemas.DocumentUpdate):
    db_doc = get_document(db, doc_id)
    if db_doc:
        update_data = doc_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_doc, key, value)
        db.commit()
        db.refresh(db_doc)
    return db_doc


def delete_document(db: Session, doc_id: int):
    db_doc = get_document(db, doc_id)
    if db_doc:
        db.delete(db_doc)
        db.commit()
    return db_doc


def share_document(db: Session, doc_id: int, user_id: int):
    """Share a document with a user"""
    db_doc = get_document(db, doc_id)
    if db_doc:
        target_user = get_user(db, user_id)
        if target_user and target_user not in db_doc.shared_with_users:
            db_doc.shared_with_users.append(target_user)
            db.commit()
            db.refresh(db_doc)
    return db_doc


def unshare_document(db: Session, doc_id: int, user_id: int):
    """Remove sharing access for a document"""
    db_doc = get_document(db, doc_id)
    if db_doc:
        target_user = get_user(db, user_id)
        if target_user and target_user in db_doc.shared_with_users:
            db_doc.shared_with_users.remove(target_user)
            db.commit()
            db.refresh(db_doc)
    return db_doc
