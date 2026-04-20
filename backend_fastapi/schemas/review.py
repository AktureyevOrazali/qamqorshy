from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ReviewBase(BaseModel):
    bookingId: str
    caregiverId: Optional[str] = None
    rating: int = Field(ge=1, le=5)
    text: str = Field(min_length=3, max_length=2000)

    @field_validator("text")
    @classmethod
    def text_must_have_visible_content(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise ValueError("text must contain at least 3 non-space characters")
        return value


class ReviewCreate(ReviewBase):
    pass


class ReviewSchema(ReviewBase):
    id: str
    authorId: str
    authorFullName: Optional[str] = None
    createdAt: datetime

    class Config:
        from_attributes = True
