from functools import wraps
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from app import crud
from app.database import get_db


# Simple mock auth - in production would use JWT
# For MVP, we pass user_id via header for demo purposes
DEMO_USERS = {
    "alice": 1,
    "bob": 2,
    "charlie": 3,
}


async def get_current_user(
    x_user_id: int = Header(None),
    db: Session = Depends(get_db)
):
    """Extract user from header. In production, would validate JWT."""
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = crud.get_user(db, x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


def check_document_access(
    user_id: int,
    document,
    is_owner_only: bool = False,
    required_role: str = "viewer",
    db: Session | None = None,
):
    """Check if user has access to document"""
    is_owner = document.owner_id == user_id
    if db is not None and not is_owner:
        role = crud.get_document_share_role(db, document.id, user_id)
    else:
        role = "owner" if is_owner else None

    is_shared = role is not None
    
    if is_owner_only:
        if not is_owner:
            raise HTTPException(status_code=403, detail="Only document owner can perform this action")
    else:
        if not (is_owner or is_shared):
            raise HTTPException(status_code=403, detail="Access denied to this document")

        if role not in (None, "owner"):
            role_levels = {"viewer": 0, "commenter": 1, "editor": 2}
            if role_levels.get(role, 0) < role_levels.get(required_role, 0):
                raise HTTPException(status_code=403, detail="Insufficient document permission")
    
    return is_owner
