from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api import deps
from db.models import User, UserRole, ClientProfile, CaregiverProfile, VerificationStatus
from schemas.profile import ProfileUpdateRequest

router = APIRouter()


def _serialize_profile(current_user: User) -> dict[str, Any]:
    user_data: dict[str, Any] = {
        "id": current_user.id,
        "email": current_user.email,
        "fullName": current_user.fullName,
        "phone": current_user.phone,
        "role": current_user.role,
        "createdAt": current_user.createdAt,
    }

    if current_user.role == UserRole.CLIENT and current_user.clientProfile:
        user_data["clientProfile"] = {
            "address": current_user.clientProfile.address,
            "about": current_user.clientProfile.about,
        }
    elif current_user.role == UserRole.CAREGIVER and current_user.caregiver:
        user_data["caregiver"] = {
            "bio": current_user.caregiver.bio,
            "experienceYears": current_user.caregiver.experienceYears,
            "hourlyRate": current_user.caregiver.hourlyRate,
            "verificationStatus": current_user.caregiver.verificationStatus,
            "categories": current_user.caregiver.categories,
            "idCardUrl": current_user.caregiver.idCardUrl,
            "diplomaUrl": current_user.caregiver.diplomaUrl,
        }

    return user_data


@router.get("")
def get_profile(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user profile (includes user data + specific profile).
    """
    return _serialize_profile(current_user)


@router.patch("")
def update_profile(
    *,
    db: Session = Depends(deps.get_db),
    update_data: ProfileUpdateRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update current user profile using a single contract shared by the frontend.
    Unknown fields are rejected by Pydantic before this point.
    """
    payload = update_data.model_dump(exclude_unset=True)

    for field in ["fullName", "phone"]:
        if field in payload:
            setattr(current_user, field, payload[field])

    if current_user.role == UserRole.CLIENT:
        if not current_user.clientProfile:
            current_user.clientProfile = ClientProfile(userId=current_user.id)
            db.add(current_user.clientProfile)

        for field in ["address", "about"]:
            if field in payload:
                setattr(current_user.clientProfile, field, payload[field])

    elif current_user.role == UserRole.CAREGIVER:
        if not current_user.caregiver:
            current_user.caregiver = CaregiverProfile(userId=current_user.id)
            db.add(current_user.caregiver)

        for field in ["bio", "experienceYears", "hourlyRate", "categories", "idCardUrl", "diplomaUrl"]:
            if field in payload:
                setattr(current_user.caregiver, field, payload[field])

        submitted_docs = payload.get("idCardUrl") or payload.get("diplomaUrl")
        if submitted_docs and current_user.caregiver.verificationStatus == VerificationStatus.UNVERIFIED:
            current_user.caregiver.verificationStatus = VerificationStatus.PENDING

    else:
        raise HTTPException(status_code=403, detail="Admins cannot update profile here")

    db.commit()
    db.refresh(current_user)
    return _serialize_profile(current_user)
