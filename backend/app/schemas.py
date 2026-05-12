from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    pass


class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True


class DocumentBase(BaseModel):
    title: str
    content: str = ""


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class DocumentResponse(DocumentBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    shared_with_users: List[User] = []
    
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
    
    class Config:
        from_attributes = True
