from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from api import deps
from db.models import User, Booking, Message, Review, UserRole, BookingStatus
from schemas.user import User as UserSchema

router = APIRouter()

ACTIVE_CHAT_STATUSES = (BookingStatus.PENDING, BookingStatus.ACCEPTED)


def _chat_visible_booking_query(db: Session, current_user: User):
    base_query = db.query(Booking).filter(
        Booking.caregiverId.isnot(None),
        Booking.status.in_(ACTIVE_CHAT_STATUSES),
    )

    if current_user.role == UserRole.CLIENT:
        return base_query.options(joinedload(Booking.caregiver)).filter(Booking.clientId == current_user.id)

    if current_user.role == UserRole.CAREGIVER:
        return base_query.options(joinedload(Booking.client)).filter(Booking.caregiverId == current_user.id)

    return base_query


@router.get('', response_model=dict)
def read_users(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve chat users connected to the current user through assigned, active bookings.
    """
    users: list[UserSchema] = []
    seen_ids: set[str] = set()

    if current_user.role == UserRole.CLIENT:
        bookings = (
            _chat_visible_booking_query(db, current_user)
            .order_by(Booking.updatedAt.desc())
            .all()
        )

        for booking in bookings:
            if not booking.caregiver or booking.caregiver.id in seen_ids:
                continue
            seen_ids.add(booking.caregiver.id)
            users.append(UserSchema.model_validate(booking.caregiver))

    elif current_user.role == UserRole.CAREGIVER:
        bookings = (
            _chat_visible_booking_query(db, current_user)
            .order_by(Booking.updatedAt.desc())
            .all()
        )

        for booking in bookings:
            if not booking.client or booking.client.id in seen_ids:
                continue
            seen_ids.add(booking.client.id)
            users.append(UserSchema.model_validate(booking.client))

    return {'users': users}


@router.get('/me', response_model=UserSchema)
def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return current_user


@router.get('/me/dashboard', response_model=dict)
def read_user_dashboard(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    query = db.query(Booking).options(
        joinedload(Booking.reviews),
        joinedload(Booking.client).joinedload(User.clientProfile),
        joinedload(Booking.caregiver)
    ).order_by(Booking.scheduledAt.desc())

    if current_user.role == UserRole.CLIENT:
        bookings = query.filter(Booking.clientId == current_user.id).all()
    elif current_user.role == UserRole.CAREGIVER:
        bookings = query.filter(Booking.caregiverId == current_user.id).all()
    else:
        bookings = query.all()

    formatted_bookings = []
    for b in bookings:
        reviews_data = []
        for r in b.reviews:
            reviews_data.append({
                'id': r.id,
                'rating': r.rating,
                'text': r.text
            })

        formatted_bookings.append({
            'id': b.id,
            'serviceType': b.serviceType,
            'scheduledAt': b.scheduledAt,
            'duration': b.duration,
            'status': b.status,
            'tasks': b.tasks,
            'address': b.address,
            'notes': b.notes,
            'price': b.price,
            'lastPriceProposedBy': b.lastPriceProposedBy,
            'priceProposedAt': b.priceProposedAt,
            'client': {
                'id': b.client.id if b.client else None,
                'fullName': b.client.fullName if b.client else 'Unknown',
                'clientProfile': {
                    'address': b.client.clientProfile.address if b.client and b.client.clientProfile else None,
                    'about': b.client.clientProfile.about if b.client and b.client.clientProfile else None,
                }
            },
            'caregiver': {'id': b.caregiver.id, 'fullName': b.caregiver.fullName} if b.caregiver else None,
            'reviews': reviews_data
        })

    messages_count = db.query(Message).filter(or_(Message.senderId == current_user.id, Message.receiverId == current_user.id)).count()

    if current_user.role == UserRole.CAREGIVER:
        reviews_count = db.query(Review).filter(Review.caregiverId == current_user.id).count()
    else:
        reviews_count = db.query(Review).filter(Review.authorId == current_user.id).count()

    return {
        'bookings': formatted_bookings,
        'messagesCount': messages_count,
        'reviewsCount': reviews_count
    }


@router.get('/{user_id}', response_model=UserSchema)
def read_user_by_id(
    user_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return user
