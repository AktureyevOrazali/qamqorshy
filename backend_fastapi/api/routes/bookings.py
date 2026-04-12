from typing import Any, List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload

from api import deps
from db.models import User, UserRole, Booking, BookingStatus, ServiceType, IgnoredBooking, Message, get_now
from schemas.booking import BookingCreate, BookingSchema, BookingUpdate

router = APIRouter()


class AcceptBookingRequest(BaseModel):
    price: Optional[int] = None


class CounterOfferRequest(BaseModel):
    price: int


class ClientDecisionRequest(BaseModel):
    action: Literal['accept', 'counter', 'cancel']
    price: Optional[int] = None


def _normalize_collection_field(value: Any) -> Any:
    if isinstance(value, str):
        parts = [item.strip() for item in value.split(",") if item.strip()]
        return parts if parts else None
    return value


def _booking_query(db: Session):
    return db.query(Booking).options(
        joinedload(Booking.client).joinedload(User.clientProfile),
        joinedload(Booking.caregiver),
        joinedload(Booking.reviews),
    )


def _serialize_booking(booking: Booking) -> BookingSchema:
    schema_obj = BookingSchema.model_validate(booking)
    schema_obj.caregiverFullName = booking.caregiver.fullName if booking.caregiver else None
    return schema_obj


def _require_positive_price(price: Optional[int]) -> int:
    if price is None or price <= 0:
        raise HTTPException(status_code=400, detail="Price must be greater than zero")
    return price


def _clear_completed_booking_chat(db: Session, booking: Booking) -> None:
    if not booking.caregiverId:
        return

    db.query(Message).filter(Message.bookingId == booking.id).delete(synchronize_session=False)

    has_other_active_booking = db.query(Booking.id).filter(
        Booking.id != booking.id,
        Booking.clientId == booking.clientId,
        Booking.caregiverId == booking.caregiverId,
        Booking.status.in_((BookingStatus.PENDING, BookingStatus.ACCEPTED)),
    ).first()

    if has_other_active_booking:
        return

    db.query(Message).filter(
        Message.bookingId.is_(None),
        or_(
            and_(Message.senderId == booking.clientId, Message.receiverId == booking.caregiverId),
            and_(Message.senderId == booking.caregiverId, Message.receiverId == booking.clientId),
        ),
    ).delete(synchronize_session=False)


@router.post("", response_model=BookingSchema)
def create_booking(
    *,
    db: Session = Depends(deps.get_db),
    booking_in: BookingCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Only clients can create bookings")

    price = booking_in.price
    if price is None:
        rates = {"CHILD": 7000, "PET": 5000, "ELDER": 8000}
        price = rates.get(booking_in.serviceType.value, 0) * booking_in.duration

    caregiver_id = booking_in.caregiverId or None
    status = BookingStatus.PENDING
    if caregiver_id:
        caregiver = db.query(User).filter(User.id == caregiver_id, User.role == UserRole.CAREGIVER).first()
        if not caregiver:
            raise HTTPException(status_code=404, detail="Caregiver not found")

    booking = Booking(
        clientId=current_user.id,
        caregiverId=caregiver_id,
        serviceType=booking_in.serviceType,
        scheduledAt=booking_in.scheduledAt,
        duration=booking_in.duration,
        tasks=_normalize_collection_field(booking_in.tasks),
        address=booking_in.address,
        notes=booking_in.notes,
        checklist=_normalize_collection_field(booking_in.checklist),
        price=price,
        status=status,
        lastPriceProposedBy=None,
        priceProposedAt=None,
    )
    db.add(booking)
    db.commit()

    saved_booking = _booking_query(db).filter(Booking.id == booking.id).first()
    return _serialize_booking(saved_booking)


@router.get("", response_model=List[BookingSchema])
def get_bookings(
    db: Session = Depends(deps.get_db),
    status: Optional[BookingStatus] = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    query = _booking_query(db)

    if current_user.role == UserRole.CLIENT:
        query = query.filter(Booking.clientId == current_user.id)
    elif current_user.role == UserRole.CAREGIVER:
        query = query.filter(Booking.caregiverId == current_user.id)

    if status:
        query = query.filter(Booking.status == status)

    bookings = query.order_by(Booking.createdAt.desc()).all()
    return [_serialize_booking(booking) for booking in bookings]


@router.get("/available", response_model=List[BookingSchema])
def get_available_bookings(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    service_type: Optional[ServiceType] = Query(default=None),
    serviceType: Optional[ServiceType] = Query(default=None),
) -> Any:
    if current_user.role not in {UserRole.CAREGIVER, UserRole.ADMIN}:
        raise HTTPException(status_code=403, detail="Only caregivers and admins can browse available bookings")

    ignored_ids = []
    if current_user.role == UserRole.CAREGIVER:
        ignored_ids = [ignored.bookingId for ignored in current_user.ignoredBookings]

    selected_type = service_type or serviceType

    query = _booking_query(db).filter(
        Booking.caregiverId == None,
        Booking.status == BookingStatus.PENDING,
    )

    if ignored_ids:
        query = query.filter(~Booking.id.in_(ignored_ids))

    if selected_type:
        query = query.filter(Booking.serviceType == selected_type)

    bookings = query.order_by(Booking.createdAt.desc()).all()
    return [_serialize_booking(booking) for booking in bookings]


@router.post("/{id}/accept", response_model=BookingSchema)
def accept_booking(
    id: str,
    payload: AcceptBookingRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.CAREGIVER:
        raise HTTPException(status_code=403, detail="Only caregivers can accept bookings")

    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending bookings can be accepted")

    if booking.caregiverId and booking.caregiverId != current_user.id:
        raise HTTPException(status_code=403, detail="Booking assigned to another caregiver")

    if payload.price is not None and payload.price != booking.price:
        raise HTTPException(status_code=400, detail="Use counter offer to change the price")

    ignored = db.query(IgnoredBooking).filter(
        IgnoredBooking.bookingId == id,
        IgnoredBooking.caregiverId == current_user.id,
    ).first()
    if ignored:
        db.delete(ignored)

    booking.caregiverId = current_user.id
    booking.status = BookingStatus.ACCEPTED
    booking.lastPriceProposedBy = None
    booking.priceProposedAt = None

    db.commit()
    saved_booking = _booking_query(db).filter(Booking.id == id).first()
    return _serialize_booking(saved_booking)


@router.post("/{id}/counter", response_model=BookingSchema)
def counter_offer_booking(
    id: str,
    payload: CounterOfferRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.CAREGIVER:
        raise HTTPException(status_code=403, detail="Only caregivers can make a counter offer")

    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status in {BookingStatus.COMPLETED, BookingStatus.CANCELED}:
        raise HTTPException(status_code=400, detail="This booking is no longer active")

    if booking.caregiverId and booking.caregiverId != current_user.id:
        raise HTTPException(status_code=403, detail="Booking assigned to another caregiver")

    ignored = db.query(IgnoredBooking).filter(
        IgnoredBooking.bookingId == id,
        IgnoredBooking.caregiverId == current_user.id,
    ).first()
    if ignored:
        db.delete(ignored)

    booking.caregiverId = current_user.id
    booking.status = BookingStatus.PENDING
    booking.price = _require_positive_price(payload.price)
    booking.lastPriceProposedBy = UserRole.CAREGIVER
    booking.priceProposedAt = get_now()

    db.commit()
    saved_booking = _booking_query(db).filter(Booking.id == id).first()
    return _serialize_booking(saved_booking)


@router.post("/{id}/client-decision", response_model=BookingSchema)
def client_booking_decision(
    id: str,
    payload: ClientDecisionRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Only clients can respond to a counter offer")

    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.clientId != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to update this booking")

    if not booking.caregiverId:
        raise HTTPException(status_code=400, detail="This booking does not have an assigned caregiver yet")

    if booking.status not in {BookingStatus.PENDING, BookingStatus.ACCEPTED}:
        raise HTTPException(status_code=400, detail="This booking can no longer be updated")

    if payload.action == 'accept':
        booking.status = BookingStatus.ACCEPTED
        booking.lastPriceProposedBy = None
        booking.priceProposedAt = None
    elif payload.action == 'counter':
        if booking.status != BookingStatus.PENDING:
            raise HTTPException(status_code=400, detail="Only pending negotiations can be countered")
        booking.status = BookingStatus.PENDING
        booking.price = _require_positive_price(payload.price)
        booking.lastPriceProposedBy = UserRole.CLIENT
        booking.priceProposedAt = get_now()
    elif payload.action == 'cancel':
        booking.status = BookingStatus.CANCELED
        booking.lastPriceProposedBy = None
        booking.priceProposedAt = None

    db.commit()
    saved_booking = _booking_query(db).filter(Booking.id == id).first()
    return _serialize_booking(saved_booking)


@router.post("/{id}/deny")
def deny_booking(
    id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user.role == UserRole.CAREGIVER:
        if booking.caregiverId is None and booking.status == BookingStatus.PENDING:
            existing = db.query(IgnoredBooking).filter(
                IgnoredBooking.bookingId == id,
                IgnoredBooking.caregiverId == current_user.id,
            ).first()
            if not existing:
                db.add(IgnoredBooking(bookingId=id, caregiverId=current_user.id))
                db.commit()
            return {"message": "Booking ignored"}

        if booking.caregiverId == current_user.id and booking.status in {BookingStatus.ACCEPTED, BookingStatus.PENDING}:
            booking.status = BookingStatus.CANCELED
            booking.lastPriceProposedBy = None
            booking.priceProposedAt = None
            db.commit()
            return {"message": "Booking canceled by caregiver"}

        raise HTTPException(status_code=403, detail="Cannot deny this booking")

    if current_user.role == UserRole.CLIENT and booking.clientId == current_user.id:
        booking.status = BookingStatus.CANCELED
        booking.lastPriceProposedBy = None
        booking.priceProposedAt = None
        db.commit()
        return {"message": "Booking canceled by client"}

    raise HTTPException(status_code=403, detail="Cannot deny this booking")


@router.patch("/{id}/status", response_model=BookingSchema)
def update_booking_status(
    id: str,
    update_in: BookingUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    is_owner = booking.clientId == current_user.id or booking.caregiverId == current_user.id or current_user.role == UserRole.ADMIN
    if not is_owner:
        raise HTTPException(status_code=403, detail="Not allowed to update this booking")

    if update_in.status == BookingStatus.COMPLETED and current_user.role not in {UserRole.CAREGIVER, UserRole.ADMIN}:
        raise HTTPException(status_code=403, detail="Only the caregiver can complete the booking")

    booking.status = update_in.status
    if update_in.status != BookingStatus.PENDING:
        booking.lastPriceProposedBy = None
        booking.priceProposedAt = None
    if update_in.status == BookingStatus.COMPLETED:
        _clear_completed_booking_chat(db, booking)
    db.commit()

    saved_booking = _booking_query(db).filter(Booking.id == id).first()
    return _serialize_booking(saved_booking)


@router.get("/{id}", response_model=BookingSchema)
def get_booking(
    id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    booking = _booking_query(db).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    is_allowed = current_user.role == UserRole.ADMIN or current_user.id in {booking.clientId, booking.caregiverId}
    if booking.caregiverId is None and current_user.role == UserRole.CAREGIVER:
        is_allowed = True

    if not is_allowed:
        raise HTTPException(status_code=403, detail="Not allowed to view this booking")

    return _serialize_booking(booking)

