from typing import Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime

class QualityUpdateCreate(BaseModel):
    bookingId: str
    text: str = Field(min_length=1, max_length=2000)
    checklist: Optional[Any] = None

class QualityUpdateSchema(BaseModel):
    id: str
    bookingId: str
    caregiverId: str
    text: str
    checklist: Optional[Any] = None
    createdAt: datetime

    class Config:
        from_attributes = True
