from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from api import deps
from db.models import User, UserRole, CaregiverProfile, VerificationStatus, BookingStatus, Review, get_now
from schemas.profile import CaregiverProfile as CaregiverProfileSchema

router = APIRouter()


@router.get("/admin", response_model=List[dict])
def get_all_caregivers_admin(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    caregivers = (
        db.query(CaregiverProfile)
        .options(joinedload(CaregiverProfile.user))
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for caregiver in caregivers:
        if caregiver.user:
            result.append(
                {
                    "id": caregiver.user.id,
                    "fullName": caregiver.user.fullName,
                    "email": caregiver.user.email,
                    "caregiver": CaregiverProfileSchema.model_validate(caregiver),
                }
            )
    return result


@router.put("/admin/{user_id}/verify")
def verify_caregiver_admin(
    user_id: str,
    status_data: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    status = status_data.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    cg_profile = db.query(CaregiverProfile).filter(CaregiverProfile.userId == user_id).first()
    if not cg_profile:
        raise HTTPException(status_code=404, detail="Caregiver profile not found")

    cg_profile.verificationStatus = status
    if status == VerificationStatus.VERIFIED:
        cg_profile.verifiedAt = get_now()
    else:
        cg_profile.verifiedAt = None

    db.commit()
    db.refresh(cg_profile)
    return CaregiverProfileSchema.model_validate(cg_profile)


@router.get("", response_model=List[dict])
def get_caregivers(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    users = (
        db.query(User)
        .options(
            joinedload(User.caregiver),
            joinedload(User.receivedReviews),
            joinedload(User.caregiverJobs),
        )
        .filter(User.role == UserRole.CAREGIVER)
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for user in users:
        cg = user.caregiver
        if not cg:
            continue

        reviews = user.receivedReviews
        completed_jobs = len([job for job in user.caregiverJobs if job.status == BookingStatus.COMPLETED])

        result.append(
            {
                "id": user.id,
                "fullName": user.fullName,
                "caregiver": {
                    "bio": cg.bio,
                    "hourlyRate": cg.hourlyRate,
                    "experienceYears": cg.experienceYears,
                    "categories": cg.categories,
                    "diplomaUrl": cg.diplomaUrl,
                    "verificationStatus": cg.verificationStatus,
                },
                "receivedReviews": [{"rating": review.rating} for review in reviews],
                "_count": {"caregiverJobs": completed_jobs},
            }
        )
    return result


@router.get("/{user_id}", response_model=dict)
def get_caregiver_by_id(
    user_id: str,
    db: Session = Depends(deps.get_db),
) -> Any:
    user = (
        db.query(User)
        .options(
            joinedload(User.caregiver),
            joinedload(User.receivedReviews).joinedload(Review.author),
            joinedload(User.caregiverJobs),
        )
        .filter(User.id == user_id, User.role == UserRole.CAREGIVER)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    cg_profile = user.caregiver

    reviews = []
    for review in user.receivedReviews:
        reviews.append(
            {
                "id": review.id,
                "rating": review.rating,
                "text": review.text,
                "createdAt": review.createdAt,
                "author": {"fullName": review.author.fullName if review.author else "Unknown"},
            }
        )

    jobs = []
    for booking in user.caregiverJobs[:8]:
        jobs.append(
            {
                "id": booking.id,
                "serviceType": booking.serviceType,
                "scheduledAt": booking.scheduledAt,
                "status": booking.status,
            }
        )

    return {
        "id": user.id,
        "fullName": user.fullName,
        "caregiver": {
            "bio": cg_profile.bio if cg_profile else "",
            "hourlyRate": cg_profile.hourlyRate if cg_profile else 0,
            "experienceYears": cg_profile.experienceYears if cg_profile else 0,
            "categories": cg_profile.categories if cg_profile else "",
            "diplomaUrl": cg_profile.diplomaUrl if cg_profile else None,
            "verificationStatus": cg_profile.verificationStatus if cg_profile else VerificationStatus.PENDING,
        },
        "receivedReviews": reviews,
        "caregiverJobs": jobs,
    }
