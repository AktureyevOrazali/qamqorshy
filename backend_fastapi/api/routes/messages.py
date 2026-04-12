from pathlib import Path
from typing import Any, Optional
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from api import deps
from db.models import Booking, BookingStatus, Message, User
from schemas.message import MessageCreate, MessageListResponse, MessageSchema

router = APIRouter()

ACTIVE_CHAT_STATUSES = (BookingStatus.PENDING, BookingStatus.ACCEPTED)
UPLOADS_DIR = Path(__file__).resolve().parents[2] / 'uploads' / 'messages'
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
}


def _get_active_shared_booking(db: Session, current_user_id: str, other_user_id: str) -> Optional[Booking]:
    return db.query(Booking).filter(
        or_(
            and_(Booking.clientId == current_user_id, Booking.caregiverId == other_user_id),
            and_(Booking.clientId == other_user_id, Booking.caregiverId == current_user_id),
        ),
        Booking.caregiverId.isnot(None),
        Booking.status.in_(ACTIVE_CHAT_STATUSES),
    ).order_by(Booking.updatedAt.desc()).first()


def _validate_chat_participants(db: Session, current_user: User, receiver_id: str) -> Booking:
    if receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail='Cannot send messages to yourself')

    receiver = db.query(User).filter(User.id == receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail='Receiver not found')

    booking = _get_active_shared_booking(db, current_user.id, receiver.id)
    if not booking:
        raise HTTPException(status_code=403, detail='You can only message users linked to your active booking')

    return booking


def _ensure_booking_scope(requested_booking_id: Optional[str], booking: Booking) -> None:
    if requested_booking_id and requested_booking_id != booking.id:
        raise HTTPException(status_code=403, detail='Messages can only be sent inside the current active booking chat')


def _serialize_messages(messages: list[Message]) -> MessageListResponse:
    return MessageListResponse(messages=[MessageSchema.model_validate(message) for message in messages])


@router.post('', response_model=MessageSchema)
def create_message(
    *,
    db: Session = Depends(deps.get_db),
    message_in: MessageCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    body = message_in.body.strip()
    if not body:
        raise HTTPException(status_code=400, detail='Message body cannot be empty')

    booking = _validate_chat_participants(db, current_user, message_in.receiverId)
    _ensure_booking_scope(message_in.bookingId, booking)

    message = Message(
        senderId=current_user.id,
        receiverId=message_in.receiverId,
        bookingId=booking.id,
        body=body,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.post('/upload', response_model=MessageSchema)
async def upload_message_image(
    *,
    db: Session = Depends(deps.get_db),
    receiverId: str = Form(...),
    bookingId: Optional[str] = Form(None),
    body: str = Form(''),
    image: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if not image.content_type or image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail='Only JPG, PNG, WEBP, and GIF images are allowed')

    booking = _validate_chat_participants(db, current_user, receiverId)
    _ensure_booking_scope(bookingId, booking)

    body_text = body.strip()
    file_bytes = await image.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail='Image file is empty')

    if len(file_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail='Image file is too large. Maximum size is 5 MB')

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    suffix = Path(image.filename or '').suffix.lower() or ALLOWED_IMAGE_TYPES[image.content_type]
    file_name = f'{uuid.uuid4()}{suffix}'
    file_path = UPLOADS_DIR / file_name
    file_path.write_bytes(file_bytes)
    await image.close()

    message = Message(
        senderId=current_user.id,
        receiverId=receiverId,
        bookingId=booking.id,
        body=body_text,
        attachmentUrl=f'/uploads/messages/{file_name}',
        attachmentMimeType=image.content_type,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get('', response_model=MessageListResponse)
def get_messages(
    withUserId: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    active_booking: Optional[Booking] = None
    if withUserId:
        active_booking = _get_active_shared_booking(db, current_user.id, withUserId)
        if not active_booking:
            return MessageListResponse(messages=[])

    query = db.query(Message).filter(
        or_(
            Message.senderId == current_user.id,
            Message.receiverId == current_user.id,
        )
    )

    if withUserId:
        query = query.filter(
            or_(
                and_(Message.senderId == current_user.id, Message.receiverId == withUserId),
                and_(Message.senderId == withUserId, Message.receiverId == current_user.id),
            )
        ).filter(
            or_(
                Message.bookingId == active_booking.id,
                Message.bookingId.is_(None),
            )
        )

    messages = query.order_by(Message.createdAt.asc()).all()
    return _serialize_messages(messages)
