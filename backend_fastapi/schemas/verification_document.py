from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from db.models import VerificationDocumentStatus, VerificationDocumentType


class VerificationDocumentReviewRequest(BaseModel):
    status: VerificationDocumentStatus
    adminComment: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("adminComment")
    @classmethod
    def strip_comment(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        return value or None


class VerificationDocumentSchema(BaseModel):
    id: str
    caregiverProfileId: str
    documentType: VerificationDocumentType
    fileUrl: str
    originalFileName: Optional[str] = None
    mimeType: Optional[str] = None
    status: VerificationDocumentStatus
    adminComment: Optional[str] = None
    reviewedByUserId: Optional[str] = None
    reviewedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class VerificationDocumentListResponse(BaseModel):
    documents: list[VerificationDocumentSchema]
