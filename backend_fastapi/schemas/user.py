from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from db.models import UserRole, ServiceType

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    fullName: str
    phone: Optional[str] = None
    role: UserRole

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    categories: Optional[list[ServiceType]] = None
    hourlyRate: Optional[int] = Field(default=None, ge=0)

# Properties to receive via API on update
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    fullName: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class ClientProfileSchema(BaseModel):
    address: Optional[str] = None
    about: Optional[str] = None
    
    class Config:
        from_attributes = True

# Additional properties to return via API
class User(UserInDBBase):
    clientProfile: Optional[ClientProfileSchema] = None

# Properties stored in DB
class UserInDB(UserInDBBase):
    passwordHash: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
