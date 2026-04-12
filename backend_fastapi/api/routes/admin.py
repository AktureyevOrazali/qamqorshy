from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api import deps
from db.models import User, Booking, Review, UserRole

router = APIRouter()

@router.get("/stats", response_model=dict)
def get_admin_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get global stats for admin.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    users_count = db.query(User).count()
    bookings_count = db.query(Booking).count()
    reviews_count = db.query(Review).count()
    
    return {
        "usersCount": users_count,
        "bookingsCount": bookings_count,
        "reviewsCount": reviews_count
    }
