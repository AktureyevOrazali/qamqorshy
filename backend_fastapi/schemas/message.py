from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class MessageCreate(BaseModel):
    receiverId: str
    bookingId: Optional[str] = None
    body: str


class MessageSchema(BaseModel):
    id: str
    senderId: str
    receiverId: str
    bookingId: Optional[str] = None
    body: str
    attachmentUrl: Optional[str] = None
    attachmentMimeType: Optional[str] = None
    createdAt: datetime

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    messages: list[MessageSchema]
