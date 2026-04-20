from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field, field_validator

from db.models import BookingStatus, ServiceType, UserRole
from schemas.review import ReviewSchema
from schemas.user import User


class BookingBase(BaseModel):
    serviceType: ServiceType
    scheduledAt: datetime
    duration: int = Field(default=1, ge=1, le=24)
    tasks: Optional[Any] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    checklist: Optional[Any] = None
    price: Optional[int] = Field(default=None, gt=0)

    @field_validator("scheduledAt")
    @classmethod
    def scheduled_at_must_be_future(cls, value: datetime) -> datetime:
        if value <= datetime.now(value.tzinfo):
            raise ValueError("scheduledAt must be in the future")
        return value


class BookingCreate(BookingBase):
    caregiverId: Optional[str] = None


class BookingUpdate(BaseModel):
    status: BookingStatus


class BookingSchema(BookingBase):
    id: str
    clientId: str
    caregiverId: Optional[str] = None
    caregiverFullName: Optional[str] = None
    client: Optional[User] = None
    reviews: List[ReviewSchema] = []
    status: BookingStatus
    lastPriceProposedBy: Optional[UserRole] = None
    priceProposedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True
