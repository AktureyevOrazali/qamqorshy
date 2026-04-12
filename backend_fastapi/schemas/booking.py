from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime
from db.models import ServiceType, BookingStatus, UserRole
from schemas.user import User
from schemas.review import ReviewSchema

class BookingBase(BaseModel):
    serviceType: ServiceType
    scheduledAt: datetime
    duration: int = 1
    tasks: Optional[Any] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    checklist: Optional[Any] = None
    price: Optional[int] = None

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

