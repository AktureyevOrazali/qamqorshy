from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from db.models import VerificationStatus


class ClientProfileUpdate(BaseModel):
    address: Optional[str] = None
    about: Optional[str] = None


class CaregiverProfileUpdate(BaseModel):
    bio: Optional[str] = None
    experienceYears: Optional[int] = Field(default=None, ge=0)
    hourlyRate: Optional[int] = Field(default=None, ge=0)
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
    experienceYears: Optional[int] = Field(default=None, ge=0)
    hourlyRate: Optional[int] = Field(default=None, ge=0)
    categories: Optional[str] = None
    idCardUrl: Optional[str] = None
    diplomaUrl: Optional[str] = None

    @field_validator("fullName", "phone", "address", "about", "bio", "categories", "idCardUrl", "diplomaUrl")
    @classmethod
    def strip_string_fields(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        return value or None
