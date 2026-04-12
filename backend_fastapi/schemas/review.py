from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

class ReviewBase(BaseModel):
    bookingId: str
    caregiverId: Optional[str] = None
    rating: int = Field(ge=1, le=5)
    text: str = Field(min_length=3, max_length=2000)

class ReviewCreate(BaseModel):
    bookingId: str
    caregiverId: Optional[str] = None
    rating: int = Field(ge=1, le=5)
    text: str = Field(min_length=3, max_length=2000)

class ReviewSchema(ReviewBase):
    id: str
    authorId: str
    authorFullName: Optional[str] = None
    createdAt: datetime

    class Config:
        from_attributes = True
