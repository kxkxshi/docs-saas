from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Literal


class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    pass


class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True


class SharedUser(User):
    role: str


class DocumentBase(BaseModel):
    title: str
    content: str = ""


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class ShareRequest(BaseModel):
    user_id: int
    role: Literal["viewer", "commenter", "editor"] = "viewer"


class ShareUpdate(BaseModel):
    role: Literal["viewer", "commenter", "editor"]


class DocumentVersionResponse(BaseModel):
    id: int
    document_id: int
    version_number: int
    title: str
    content: str
    created_by_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    body: str
    snippet: Optional[str] = ""
    kind: Literal["comment", "suggestion"] = "comment"


class CommentUpdate(BaseModel):
    is_resolved: bool


class CommentResponse(BaseModel):
    id: int
    document_id: int
    author_id: int
    body: str
    snippet: str = ""
    kind: str
    is_resolved: bool
    created_at: datetime
    author: User

    class Config:
        from_attributes = True


class CollaboratorPresence(BaseModel):
    id: int
    username: str
    email: str
    role: str
    last_seen_at: datetime
    is_active: bool


class CollaborationResponse(BaseModel):
    document_id: int
    access_role: str
    shared_with_users: List[SharedUser]
    active_collaborators: List[CollaboratorPresence]
    version_count: int
    comment_count: int


class DocumentResponse(DocumentBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    is_owner: bool
    permission_role: str = "viewer"
    shared_with_users: List[SharedUser] = []
    
    class Config:
        from_attributes = True


class DocumentListItem(BaseModel):
    id: int
    title: str
    owner_id: int
    created_at: datetime
    updated_at: datetime
    is_owner: bool
    is_shared: bool
    permission_role: str = "viewer"
    shared_with_users: List[SharedUser] = []
    
    class Config:
        from_attributes = True
