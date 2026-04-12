from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from api import deps
from db.models import User, Review, UserRole, Booking, BookingStatus
from schemas.review import ReviewCreate, ReviewSchema

router = APIRouter()


@router.post("", response_model=ReviewSchema)
def create_review(
    *,
    db: Session = Depends(deps.get_db),
    review_in: ReviewCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Only clients can leave reviews")

    booking = db.query(Booking).options(joinedload(Booking.reviews)).filter(Booking.id == review_in.bookingId).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.clientId != current_user.id:
        raise HTTPException(status_code=403, detail="You can review only your own bookings")

    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(status_code=403, detail="Reviews are allowed only for completed bookings")

    caregiver_id = review_in.caregiverId or booking.caregiverId
    if not caregiver_id:
        raise HTTPException(status_code=400, detail="Booking has no assigned caregiver")

    existing = db.query(Review).filter(Review.bookingId == booking.id, Review.authorId == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Review for this booking already exists")

    review = Review(
        bookingId=booking.id,
        authorId=current_user.id,
        caregiverId=caregiver_id,
        rating=review_in.rating,
        text=review_in.text.strip(),
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    schema_obj = ReviewSchema.model_validate(review)
    schema_obj.authorFullName = current_user.fullName
    return schema_obj


@router.get("", response_model=List[ReviewSchema])
def get_reviews(
    db: Session = Depends(deps.get_db),
    caregiverId: Optional[str] = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get reviews for a caregiver. If caregiverId is not provided but the user is a caregiver,
    return their own reviews. Clients receive the reviews they authored only when no caregiver is targeted.
    """
    query = db.query(Review).options(joinedload(Review.author))

    target_id = caregiverId
    if not target_id and current_user.role == UserRole.CAREGIVER:
        target_id = current_user.id

    if target_id:
        query = query.filter(Review.caregiverId == target_id)
    elif current_user.role == UserRole.CLIENT:
        query = query.filter(Review.authorId == current_user.id)

    reviews = query.order_by(Review.createdAt.desc()).all()

    result = []
    for review in reviews:
        schema_obj = ReviewSchema.model_validate(review)
        schema_obj.authorFullName = review.author.fullName if review.author else None
        result.append(schema_obj)

    return result
