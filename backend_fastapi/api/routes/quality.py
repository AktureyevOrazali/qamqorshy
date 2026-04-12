from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api import deps
from db.models import User, QualityUpdate, UserRole, Booking, BookingStatus
from schemas.quality import QualityUpdateCreate, QualityUpdateSchema

router = APIRouter()


@router.post("", response_model=QualityUpdateSchema)
def create_quality_update(
    *,
    db: Session = Depends(deps.get_db),
    update_in: QualityUpdateCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.CAREGIVER:
        raise HTTPException(status_code=403, detail="Only caregivers can post quality updates")

    booking = db.query(Booking).filter(Booking.id == update_in.bookingId).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.caregiverId != current_user.id:
        raise HTTPException(status_code=403, detail="You can update only your assigned bookings")
    if booking.status == BookingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Completed bookings cannot receive new updates")

    update = QualityUpdate(
        bookingId=update_in.bookingId,
        caregiverId=current_user.id,
        text=update_in.text.strip(),
        checklist=update_in.checklist,
    )
    db.add(update)
    db.commit()
    db.refresh(update)
    return update


@router.get("", response_model=List[QualityUpdateSchema])
def get_quality_updates(
    bookingId: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    booking = db.query(Booking).filter(Booking.id == bookingId).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    is_allowed = current_user.role == UserRole.ADMIN or current_user.id in {booking.clientId, booking.caregiverId}
    if not is_allowed:
        raise HTTPException(status_code=403, detail="Not allowed to view updates for this booking")

    return db.query(QualityUpdate).filter(QualityUpdate.bookingId == bookingId).order_by(QualityUpdate.createdAt.asc()).all()
