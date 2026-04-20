from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


class QualityUpdateCreate(BaseModel):
    bookingId: str
    text: str = Field(min_length=1, max_length=2000)
    checklist: Optional[Any] = None

    @field_validator("text")
    @classmethod
    def text_must_have_visible_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("text cannot be blank")
        return value


class QualityUpdateSchema(BaseModel):
    id: str
    bookingId: str
    caregiverId: str
    text: str
    checklist: Optional[Any] = None
    createdAt: datetime

    class Config:
        from_attributes = True
