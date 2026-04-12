from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from db.models import VerificationStatus

class ClientProfileUpdate(BaseModel):
    address: Optional[str] = None
    about: Optional[str] = None

class CaregiverProfileUpdate(BaseModel):
    bio: Optional[str] = None
    experienceYears: Optional[int] = None
    hourlyRate: Optional[int] = None
    categories: Optional[str] = None
    idCardUrl: Optional[str] = None
    diplomaUrl: Optional[str] = None

class ClientProfile(BaseModel):
    id: str
    userId: str
    address: Optional[str] = None
    about: Optional[str] = None

    class Config:
        from_attributes = True

class CaregiverProfile(BaseModel):
    id: str
    userId: str
    bio: Optional[str] = None
    experienceYears: int = 0
    hourlyRate: int = 0
    verificationStatus: VerificationStatus
    categories: str = ""
    idCardUrl: Optional[str] = None
    diplomaUrl: Optional[str] = None
    verifiedAt: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProfileUpdateRequest(BaseModel):
    fullName: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    about: Optional[str] = None
    bio: Optional[str] = None
    experienceYears: Optional[int] = None
    hourlyRate: Optional[int] = None
    categories: Optional[str] = None
    idCardUrl: Optional[str] = None
    diplomaUrl: Optional[str] = None
