from pathlib import Path
import uuid
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload

from api import deps
from db.models import (
    CaregiverProfile,
    User,
    UserRole,
    VerificationDocument,
    VerificationDocumentStatus,
    VerificationDocumentType,
    VerificationStatus,
    derive_caregiver_verification_status,
    get_now,
)
from schemas.verification_document import (
    VerificationDocumentListResponse,
    VerificationDocumentReviewRequest,
    VerificationDocumentSchema,
)

router = APIRouter()

UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads" / "verification-documents"
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_FILE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "application/pdf": ".pdf",
}


def _recalculate_caregiver_status(caregiver_profile: CaregiverProfile) -> None:
    caregiver_profile.verificationStatus = derive_caregiver_verification_status(
        caregiver_profile.verificationDocuments
    )
    if caregiver_profile.verificationStatus == VerificationStatus.VERIFIED:
        caregiver_profile.verifiedAt = get_now()
    else:
        caregiver_profile.verifiedAt = None


@router.post("", response_model=VerificationDocumentSchema)
async def upload_verification_document(
    *,
    db: Session = Depends(deps.get_db),
    documentType: VerificationDocumentType = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.CAREGIVER:
        raise HTTPException(status_code=403, detail="Only caregivers can upload verification documents")

    caregiver_profile = (
        db.query(CaregiverProfile)
        .options(joinedload(CaregiverProfile.verificationDocuments))
        .filter(CaregiverProfile.userId == current_user.id)
        .first()
    )
    if not caregiver_profile:
        raise HTTPException(status_code=400, detail="Caregiver profile not found")

    if not file.content_type or file.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, and PDF files are allowed")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Uploaded file is too large")

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "").suffix.lower() or ALLOWED_FILE_TYPES[file.content_type]
    file_name = f"{uuid.uuid4()}{suffix}"
    file_path = UPLOADS_DIR / file_name
    file_path.write_bytes(file_bytes)
    await file.close()

    document = VerificationDocument(
        caregiverProfileId=caregiver_profile.id,
        documentType=documentType,
        fileUrl=f"/uploads/verification-documents/{file_name}",
        originalFileName=file.filename,
        mimeType=file.content_type,
        status=VerificationDocumentStatus.PENDING,
    )
    db.add(document)
    db.flush()
    db.refresh(caregiver_profile)
    _recalculate_caregiver_status(caregiver_profile)
    db.commit()
    db.refresh(document)
    return document


@router.get("", response_model=VerificationDocumentListResponse)
def list_my_verification_documents(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.CAREGIVER:
        raise HTTPException(status_code=403, detail="Only caregivers can view verification documents")

    caregiver_profile = db.query(CaregiverProfile).filter(CaregiverProfile.userId == current_user.id).first()
    if not caregiver_profile:
        raise HTTPException(status_code=400, detail="Caregiver profile not found")

    documents = (
        db.query(VerificationDocument)
        .filter(VerificationDocument.caregiverProfileId == caregiver_profile.id)
        .order_by(VerificationDocument.createdAt.desc())
        .all()
    )
    return VerificationDocumentListResponse(
        documents=[VerificationDocumentSchema.model_validate(doc) for doc in documents]
    )


@router.delete("/{id}")
def delete_my_verification_document(
    id: str,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.CAREGIVER:
        raise HTTPException(status_code=403, detail="Only caregivers can delete verification documents")

    caregiver_profile = (
        db.query(CaregiverProfile)
        .options(joinedload(CaregiverProfile.verificationDocuments))
        .filter(CaregiverProfile.userId == current_user.id)
        .first()
    )
    if not caregiver_profile:
        raise HTTPException(status_code=400, detail="Caregiver profile not found")

    document = db.query(VerificationDocument).filter(VerificationDocument.id == id).first()
    if not document or document.caregiverProfileId != caregiver_profile.id:
        raise HTTPException(status_code=404, detail="Verification document not found")

    db.delete(document)
    db.flush()
    caregiver_profile.verificationDocuments = [
        doc for doc in caregiver_profile.verificationDocuments if doc.id != id
    ]
    _recalculate_caregiver_status(caregiver_profile)
    db.commit()
    return {"message": "Verification document deleted"}


@router.get("/admin", response_model=VerificationDocumentListResponse)
def list_verification_documents_for_admin(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can review verification documents")

    documents = (
        db.query(VerificationDocument)
        .options(joinedload(VerificationDocument.caregiverProfile).joinedload(CaregiverProfile.user))
        .order_by(VerificationDocument.createdAt.desc())
        .all()
    )
    return VerificationDocumentListResponse(
        documents=[VerificationDocumentSchema.model_validate(doc) for doc in documents]
    )


@router.patch("/admin/{id}", response_model=VerificationDocumentSchema)
def review_verification_document(
    id: str,
    review_in: VerificationDocumentReviewRequest,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can review verification documents")

    document = (
        db.query(VerificationDocument)
        .options(joinedload(VerificationDocument.caregiverProfile).joinedload(CaregiverProfile.verificationDocuments))
        .filter(VerificationDocument.id == id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Verification document not found")

    document.status = review_in.status
    document.adminComment = review_in.adminComment
    document.reviewedByUserId = current_user.id
    document.reviewedAt = get_now()
    _recalculate_caregiver_status(document.caregiverProfile)
    db.commit()
    db.refresh(document)
    return document
