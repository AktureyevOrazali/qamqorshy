# Verification Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a manual caregiver document verification workflow with a dedicated `verification_documents` table, caregiver upload/list actions, admin review with comments, derived caregiver verification status, and updated diploma documentation.

**Architecture:** Extend the existing FastAPI + SQLAlchemy backend with a new verification document entity and route set, then connect the Next.js profile/admin views to those endpoints. Keep document review manual: the system stores files and review metadata, while admins visually inspect uploads and set document status with comments.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, Pydantic, Next.js, React, TypeScript, Tailwind CSS

---

## File Map

### Backend files to create

- `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\schemas\verification_document.py`
- `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\api\routes\verification_documents.py`
- `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\alembic\versions\<new_revision>_add_verification_documents.py`

### Backend files to modify

- `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\db\models.py`
- `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\main.py`
- `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\api\routes\profile.py`
- `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\api\routes\caregivers.py`

### Frontend files to modify

- `C:\Users\Admin\Desktop\Qamqorhy\qamqorly2\app\profile\page.tsx`
- `C:\Users\Admin\Desktop\Qamqorhy\qamqorly2\components\profile\profile-form.tsx`
- `C:\Users\Admin\Desktop\Qamqorhy\qamqorly2\app\admin\page.tsx`
- `C:\Users\Admin\Desktop\Qamqorhy\qamqorly2\components\admin\caregiver-verify-table.tsx`
- `C:\Users\Admin\Desktop\Qamqorhy\qamqorly2\lib\api.ts`

### Documentation files to modify

- `C:\Users\Admin\Desktop\Qamqorhy\diploma\chapter3_design_methodology.tex`

### Validation commands

- `python -m compileall C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi`
- `npm run lint`

---

### Task 1: Add verification document data model

**Files:**
- Modify: `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\db\models.py`
- Test: schema import/compile verification through `python -m compileall`

- [ ] **Step 1: Add new enums and relationships in the model layer**

Add a new enum for document type and a new enum for document review status near the existing enums in `db/models.py`.

```python
class VerificationDocumentType(str, enum.Enum):
    ID_CARD = "ID_CARD"
    DIPLOMA = "DIPLOMA"
    CERTIFICATE = "CERTIFICATE"


class VerificationDocumentStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
```

Then extend existing models with relationships:

```python
class User(Base):
    # existing fields...
    reviewedVerificationDocuments = relationship(
        "VerificationDocument",
        back_populates="reviewedBy",
        foreign_keys="VerificationDocument.reviewedByUserId",
    )


class CaregiverProfile(Base):
    # existing fields...
    verificationDocuments = relationship(
        "VerificationDocument",
        back_populates="caregiverProfile",
        cascade="all, delete-orphan",
    )
```

- [ ] **Step 2: Add the new `VerificationDocument` model**

Append a new model in `db/models.py`.

```python
class VerificationDocument(Base):
    __tablename__ = "verification_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    caregiverProfileId = Column(
        String(36),
        ForeignKey("caregiver_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    documentType = Column(Enum(VerificationDocumentType), nullable=False)
    fileUrl = Column(String, nullable=False)
    originalFileName = Column(String, nullable=True)
    mimeType = Column(String, nullable=True)
    status = Column(
        Enum(VerificationDocumentStatus),
        default=VerificationDocumentStatus.PENDING,
        nullable=False,
    )
    adminComment = Column(String, nullable=True)
    reviewedByUserId = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewedAt = Column(DateTime(timezone=True), nullable=True)
    createdAt = Column(DateTime(timezone=True), default=get_now)
    updatedAt = Column(DateTime(timezone=True), default=get_now, onupdate=get_now)

    caregiverProfile = relationship("CaregiverProfile", back_populates="verificationDocuments")
    reviewedBy = relationship("User", back_populates="reviewedVerificationDocuments", foreign_keys=[reviewedByUserId])
```

- [ ] **Step 3: Add a helper function to recalculate caregiver verification state**

Add a focused helper function in `db/models.py` or, if you want to keep model logic small, note this will later be placed in a route helper. The function should reflect the agreed rules:

```python
def derive_caregiver_verification_status(documents: list["VerificationDocument"]) -> VerificationStatus:
    if not documents:
        return VerificationStatus.UNVERIFIED

    required_types = {VerificationDocumentType.ID_CARD, VerificationDocumentType.DIPLOMA}
    docs_by_type = {doc.documentType: doc for doc in documents}

    if not required_types.issubset(docs_by_type.keys()):
        return VerificationStatus.PENDING

    required_docs = [docs_by_type[doc_type] for doc_type in required_types]
    if all(doc.status == VerificationDocumentStatus.APPROVED for doc in required_docs):
        return VerificationStatus.VERIFIED
    return VerificationStatus.PENDING
```

- [ ] **Step 4: Run syntax verification**

Run: `python -m compileall C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi`

Expected: all backend files compile successfully with no syntax errors.

- [ ] **Step 5: Commit**

```bash
git add C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\db\models.py
git commit -m "feat: add verification document data model"
```

---

### Task 2: Add migration for verification documents

**Files:**
- Create: `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\alembic\versions\<new_revision>_add_verification_documents.py`
- Modify: `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\db\models.py`

- [ ] **Step 1: Create the Alembic migration file**

Create a migration similar in style to the existing versions under `alembic/versions/`.

Skeleton:

```python
"""add verification documents

Revision ID: <new_revision>
Revises: b7e2c1f49c0a
Create Date: 2026-04-20 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "<new_revision>"
down_revision = "b7e2c1f49c0a"
branch_labels = None
depends_on = None
```

- [ ] **Step 2: Write the upgrade migration**

Implement table creation with indexes:

```python
def upgrade() -> None:
    op.create_table(
        "verification_documents",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("caregiverProfileId", sa.String(length=36), nullable=False),
        sa.Column("documentType", sa.Enum("ID_CARD", "DIPLOMA", "CERTIFICATE", name="verificationdocumenttype"), nullable=False),
        sa.Column("fileUrl", sa.String(), nullable=False),
        sa.Column("originalFileName", sa.String(), nullable=True),
        sa.Column("mimeType", sa.String(), nullable=True),
        sa.Column("status", sa.Enum("PENDING", "APPROVED", "REJECTED", name="verificationdocumentstatus"), nullable=False),
        sa.Column("adminComment", sa.String(), nullable=True),
        sa.Column("reviewedByUserId", sa.String(length=36), nullable=True),
        sa.Column("reviewedAt", sa.DateTime(timezone=True), nullable=True),
        sa.Column("createdAt", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updatedAt", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["caregiverProfileId"], ["caregiver_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewedByUserId"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_verification_documents_caregiverProfileId"), "verification_documents", ["caregiverProfileId"], unique=False)
```

- [ ] **Step 3: Write the downgrade migration**

```python
def downgrade() -> None:
    op.drop_index(op.f("ix_verification_documents_caregiverProfileId"), table_name="verification_documents")
    op.drop_table("verification_documents")
    sa.Enum(name="verificationdocumentstatus").drop(op.get_bind(), checkfirst=False)
    sa.Enum(name="verificationdocumenttype").drop(op.get_bind(), checkfirst=False)
```

- [ ] **Step 4: Sanity-check the migration file**

Run: `python -m compileall C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\alembic\versions`

Expected: the new migration file compiles with no syntax errors.

- [ ] **Step 5: Commit**

```bash
git add C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\alembic\versions
git commit -m "feat: add alembic migration for verification documents"
```

---

### Task 3: Add verification document schemas

**Files:**
- Create: `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\schemas\verification_document.py`
- Modify: `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\db\models.py`
- Test: `python -m compileall`

- [ ] **Step 1: Create upload and review request schemas**

Create `schemas/verification_document.py` with:

```python
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from db.models import VerificationDocumentStatus, VerificationDocumentType


class VerificationDocumentReviewRequest(BaseModel):
    status: VerificationDocumentStatus
    adminComment: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("adminComment")
    @classmethod
    def strip_comment(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        return value or None
```

- [ ] **Step 2: Create response schemas**

Continue in the same file:

```python
class VerificationDocumentSchema(BaseModel):
    id: str
    caregiverProfileId: str
    documentType: VerificationDocumentType
    fileUrl: str
    originalFileName: Optional[str] = None
    mimeType: Optional[str] = None
    status: VerificationDocumentStatus
    adminComment: Optional[str] = None
    reviewedByUserId: Optional[str] = None
    reviewedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class VerificationDocumentListResponse(BaseModel):
    documents: list[VerificationDocumentSchema]
```

- [ ] **Step 3: Run syntax verification**

Run: `python -m compileall C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\schemas`

Expected: schema files compile successfully.

- [ ] **Step 4: Commit**

```bash
git add C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\schemas\verification_document.py
git commit -m "feat: add verification document schemas"
```

---

### Task 4: Build backend verification document routes

**Files:**
- Create: `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\api\routes\verification_documents.py`
- Modify: `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\main.py`
- Modify: `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\api\routes\profile.py`
- Modify: `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\api\routes\caregivers.py`

- [ ] **Step 1: Create route helpers**

In `verification_documents.py`, start with imports and helper functions:

```python
from pathlib import Path
import uuid
from typing import Any, Optional

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
```

- [ ] **Step 2: Add caregiver upload endpoint**

Implement upload route:

```python
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

    if not current_user.caregiver:
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
        caregiverProfileId=current_user.caregiver.id,
        documentType=documentType,
        fileUrl=f"/uploads/verification-documents/{file_name}",
        originalFileName=file.filename,
        mimeType=file.content_type,
        status=VerificationDocumentStatus.PENDING,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document
```

- [ ] **Step 3: Add caregiver list and delete endpoints**

Continue in the same file:

```python
@router.get("", response_model=VerificationDocumentListResponse)
def list_my_verification_documents(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.CAREGIVER or not current_user.caregiver:
        raise HTTPException(status_code=403, detail="Only caregivers can view verification documents")

    documents = (
        db.query(VerificationDocument)
        .filter(VerificationDocument.caregiverProfileId == current_user.caregiver.id)
        .order_by(VerificationDocument.createdAt.desc())
        .all()
    )
    return VerificationDocumentListResponse(documents=[VerificationDocumentSchema.model_validate(doc) for doc in documents])


@router.delete("/{id}")
def delete_my_verification_document(
    id: str,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.CAREGIVER or not current_user.caregiver:
        raise HTTPException(status_code=403, detail="Only caregivers can delete verification documents")

    document = db.query(VerificationDocument).filter(VerificationDocument.id == id).first()
    if not document or document.caregiverProfileId != current_user.caregiver.id:
        raise HTTPException(status_code=404, detail="Verification document not found")

    db.delete(document)
    db.commit()
    return {"message": "Verification document deleted"}
```

- [ ] **Step 4: Add admin list and review endpoints**

Continue in the same file:

```python
def _recalculate_caregiver_status(db: Session, caregiver_profile: CaregiverProfile) -> None:
    documents = caregiver_profile.verificationDocuments
    required_types = {VerificationDocumentType.ID_CARD, VerificationDocumentType.DIPLOMA}
    docs_by_type = {doc.documentType: doc for doc in documents}

    if not documents:
        caregiver_profile.verificationStatus = VerificationStatus.UNVERIFIED
        caregiver_profile.verifiedAt = None
        return

    if not required_types.issubset(docs_by_type.keys()):
        caregiver_profile.verificationStatus = VerificationStatus.PENDING
        caregiver_profile.verifiedAt = None
        return

    required_docs = [docs_by_type[doc_type] for doc_type in required_types]
    if all(doc.status == VerificationDocumentStatus.APPROVED for doc in required_docs):
        caregiver_profile.verificationStatus = VerificationStatus.VERIFIED
        caregiver_profile.verifiedAt = get_now()
        return

    caregiver_profile.verificationStatus = VerificationStatus.PENDING
    caregiver_profile.verifiedAt = None


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
        .options(joinedload(VerificationDocument.caregiverProfile))
        .order_by(VerificationDocument.createdAt.desc())
        .all()
    )
    return VerificationDocumentListResponse(documents=[VerificationDocumentSchema.model_validate(doc) for doc in documents])


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
    _recalculate_caregiver_status(db, document.caregiverProfile)
    db.commit()
    db.refresh(document)
    return document
```

- [ ] **Step 5: Register the router in `main.py`**

Add the import and include call:

```python
from api.routes import admin, auth, bookings, caregivers, lang, messages, profile, quality, reviews, users, verification_documents
```

```python
api_router.include_router(verification_documents.router, prefix="/verification-documents", tags=["verification-documents"])
```

- [ ] **Step 6: Run syntax verification**

Run: `python -m compileall C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi`

Expected: all backend files compile successfully.

- [ ] **Step 7: Commit**

```bash
git add C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\api\routes\verification_documents.py C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\main.py
git commit -m "feat: add verification document routes"
```

---

### Task 5: Surface verification documents in profile and admin APIs

**Files:**
- Modify: `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\api\routes\profile.py`
- Modify: `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\api\routes\caregivers.py`
- Modify: `C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\schemas\profile.py`

- [ ] **Step 1: Include verification document summary in profile response**

In `profile.py`, inside the caregiver branch of `_serialize_profile`, add a `verificationDocuments` field:

```python
        user_data["caregiver"] = {
            "bio": current_user.caregiver.bio,
            "experienceYears": current_user.caregiver.experienceYears,
            "hourlyRate": current_user.caregiver.hourlyRate,
            "verificationStatus": current_user.caregiver.verificationStatus,
            "categories": current_user.caregiver.categories,
            "idCardUrl": current_user.caregiver.idCardUrl,
            "diplomaUrl": current_user.caregiver.diplomaUrl,
            "verificationDocuments": [
                {
                    "id": doc.id,
                    "documentType": doc.documentType,
                    "fileUrl": doc.fileUrl,
                    "status": doc.status,
                    "adminComment": doc.adminComment,
                    "reviewedAt": doc.reviewedAt,
                }
                for doc in current_user.caregiver.verificationDocuments
            ],
        }
```

- [ ] **Step 2: Stop treating profile URLs as the primary verification workflow**

Do not remove legacy fields yet, but update any explanatory comments and admin responses so the new document table is the primary verification mechanism.

In `caregivers.py`, enrich admin-facing caregiver list items:

```python
                {
                    "id": caregiver.user.id,
                    "fullName": caregiver.user.fullName,
                    "email": caregiver.user.email,
                    "caregiver": CaregiverProfileSchema.model_validate(caregiver),
                    "verificationDocumentsCount": len(caregiver.verificationDocuments),
                }
```

- [ ] **Step 3: Update joined loading for admin caregiver queries**

In `caregivers.py`, extend the admin query:

```python
    caregivers = (
        db.query(CaregiverProfile)
        .options(
            joinedload(CaregiverProfile.user),
            joinedload(CaregiverProfile.verificationDocuments),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
```

- [ ] **Step 4: Run syntax verification**

Run: `python -m compileall C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi`

Expected: backend files compile successfully.

- [ ] **Step 5: Commit**

```bash
git add C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\api\routes\profile.py C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi\api\routes\caregivers.py
git commit -m "feat: expose verification document data in profile and admin routes"
```

---

### Task 6: Add frontend API helpers for verification documents

**Files:**
- Modify: `C:\Users\Admin\Desktop\Qamqorhy\qamqorly2\lib\api.ts`
- Test: `npm run lint`

- [ ] **Step 1: Define client-side types**

Add types near the other API types in `lib/api.ts`:

```ts
export type VerificationDocument = {
  id: string
  caregiverProfileId: string
  documentType: 'ID_CARD' | 'DIPLOMA' | 'CERTIFICATE'
  fileUrl: string
  originalFileName?: string | null
  mimeType?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminComment?: string | null
  reviewedByUserId?: string | null
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Add upload/list/review helper functions**

Append helper functions:

```ts
export async function getMyVerificationDocuments(token: string) {
  const res = await fetch(getBackendUrl('/api/verification-documents'), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to fetch verification documents')
  return res.json() as Promise<{ documents: VerificationDocument[] }>
}

export async function getAdminVerificationDocuments(token: string) {
  const res = await fetch(getBackendUrl('/api/verification-documents/admin'), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to fetch admin verification documents')
  return res.json() as Promise<{ documents: VerificationDocument[] }>
}
```

For review:

```ts
export async function reviewVerificationDocument(
  token: string,
  id: string,
  payload: { status: 'APPROVED' | 'REJECTED' | 'PENDING'; adminComment?: string }
) {
  const res = await fetch(getBackendUrl(`/api/verification-documents/admin/${id}`), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to review verification document')
  return res.json() as Promise<VerificationDocument>
}
```

- [ ] **Step 3: Run frontend lint**

Run: `npm run lint`

Expected: lint completes without new errors in `lib/api.ts`.

- [ ] **Step 4: Commit**

```bash
git add C:\Users\Admin\Desktop\Qamqorhy\qamqorly2\lib\api.ts
git commit -m "feat: add frontend verification document api helpers"
```

---

### Task 7: Add caregiver profile upload UI

**Files:**
- Modify: `C:\Users\Admin\Desktop\Qamqorhy\qamqorly2\app\profile\page.tsx`
- Modify: `C:\Users\Admin\Desktop\Qamqorhy\qamqorly2\components\profile\profile-form.tsx`

- [ ] **Step 1: Fetch verification documents on the profile page**

In `app/profile/page.tsx`, fetch the current user token and documents similarly to the existing profile fetch pattern.

```ts
const docsRes = await fetch(getBackendUrl('/api/verification-documents'), {
  headers: { Authorization: `Bearer ${token}` },
  cache: 'no-store',
})

const verificationDocuments = docsRes.ok ? (await docsRes.json()).documents : []
```

Pass them into the profile form:

```tsx
<ProfileForm initialProfile={profile} verificationDocuments={verificationDocuments} />
```

- [ ] **Step 2: Extend the profile form props**

In `components/profile/profile-form.tsx`, update props:

```ts
type ProfileFormProps = {
  initialProfile: ProfileResponse
  verificationDocuments: VerificationDocument[]
}
```

- [ ] **Step 3: Add a caregiver verification section**

Render a dedicated section for caregivers:

```tsx
{isCaregiver && (
  <section className="mt-8 rounded-2xl border border-[#e7dbcf] bg-white p-6">
    <h2 className="font-serif text-2xl font-semibold text-[#2d3147]">Verification documents</h2>
    <p className="mt-2 text-sm text-slate-600">
      Upload your ID card and diploma for manual admin review.
    </p>
    <div className="mt-4 space-y-3">
      {verificationDocuments.map((doc) => (
        <div key={doc.id} className="rounded-xl border border-[#eadbcf] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-[#2d3147]">{doc.documentType}</p>
              <p className="text-sm text-slate-500">{doc.status}</p>
              {doc.adminComment ? <p className="mt-2 text-sm text-red-700">{doc.adminComment}</p> : null}
            </div>
            <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#8d6241]">
              Open file
            </a>
          </div>
        </div>
      ))}
    </div>
  </section>
)}
```

- [ ] **Step 4: Add upload controls**

Inside the same caregiver section, add a form with:

```tsx
<form className="mt-6 grid gap-4 md:grid-cols-[220px_1fr_auto]">
  <select name="documentType" className="rounded-xl border border-[#e7dbcf] px-4 py-3">
    <option value="ID_CARD">ID card</option>
    <option value="DIPLOMA">Diploma</option>
    <option value="CERTIFICATE">Certificate</option>
  </select>
  <input type="file" name="file" accept=".jpg,.jpeg,.png,.pdf" className="rounded-xl border border-[#e7dbcf] px-4 py-3" />
  <button type="submit" className="rounded-xl bg-[#8d6241] px-5 py-3 text-white">Upload</button>
</form>
```

Implement the submit handler with `FormData` and `fetch`.

- [ ] **Step 5: Run frontend lint**

Run: `npm run lint`

Expected: lint completes without new errors in profile files.

- [ ] **Step 6: Commit**

```bash
git add C:\Users\Admin\Desktop\Qamqorhy\qamqorly2\app\profile\page.tsx C:\Users\Admin\Desktop\Qamqorhy\qamqorly2\components\profile\profile-form.tsx
git commit -m "feat: add caregiver verification upload ui"
```

---

### Task 8: Add admin review UI

**Files:**
- Modify: `C:\Users\Admin\Desktop\Qamqorhy\qamqorly2\app\admin\page.tsx`
- Modify: `C:\Users\Admin\Desktop\Qamqorhy\qamqorly2\components\admin\caregiver-verify-table.tsx`

- [ ] **Step 1: Fetch verification documents in the admin page**

In `app/admin/page.tsx`, add another request:

```ts
const verificationDocsRes = await fetch(getBackendUrl('/api/verification-documents/admin'), {
  headers: { Authorization: `Bearer ${token}` },
  cache: 'no-store',
})

if (!verificationDocsRes.ok) {
  throw new Error('Failed to fetch verification documents')
}

const verificationDocuments = (await verificationDocsRes.json()).documents
```

Pass them into the component:

```tsx
<CaregiverVerifyTable initial={caregivers} verificationDocuments={verificationDocuments} />
```

- [ ] **Step 2: Extend the admin component props**

In `caregiver-verify-table.tsx`, add:

```ts
type CaregiverVerifyTableProps = {
  initial: AdminCaregiver[]
  verificationDocuments: VerificationDocument[]
}
```

- [ ] **Step 3: Render a document review queue**

Add a second section below the caregiver list:

```tsx
<section className="mt-8 space-y-4">
  <h3 className="font-serif text-2xl font-semibold text-[#2d3147]">Verification documents</h3>
  {verificationDocuments.map((doc) => (
    <div key={doc.id} className="rounded-2xl border border-[#e7dbcf] bg-white p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-[#2d3147]">{doc.documentType}</p>
          <p className="text-sm text-slate-500">{doc.status}</p>
          {doc.adminComment ? <p className="mt-2 text-sm text-slate-700">{doc.adminComment}</p> : null}
        </div>
        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#8d6241]">
          Open file
        </a>
      </div>
    </div>
  ))}
</section>
```

- [ ] **Step 4: Add approve/reject form controls**

For each item, add:

```tsx
<div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
  <input
    type="text"
    placeholder="Admin comment"
    className="rounded-xl border border-[#e7dbcf] px-4 py-3"
  />
  <button className="rounded-xl border border-[#d7c7b8] px-4 py-3 text-[#8d6241]">Reject</button>
  <button className="rounded-xl bg-[#8d6241] px-4 py-3 text-white">Approve</button>
</div>
```

Hook those buttons to the new `reviewVerificationDocument` helper.

- [ ] **Step 5: Run frontend lint**

Run: `npm run lint`

Expected: admin files lint successfully.

- [ ] **Step 6: Commit**

```bash
git add C:\Users\Admin\Desktop\Qamqorhy\qamqorly2\app\admin\page.tsx C:\Users\Admin\Desktop\Qamqorhy\qamqorly2\components\admin\caregiver-verify-table.tsx
git commit -m "feat: add admin verification document review ui"
```

---

### Task 9: Update Chapter 3 documentation

**Files:**
- Modify: `C:\Users\Admin\Desktop\Qamqorhy\diploma\chapter3_design_methodology.tex`

- [ ] **Step 1: Update the database scheme description**

Revise the ERD section text so it includes `verification_documents` and explains that each uploaded file is stored as a separate record with review metadata.

Suggested paragraph to insert:

```tex
The improved verification workflow introduces a dedicated \texttt{verification\_documents} table. Each record belongs to a caregiver profile and stores the document type, file path, review status, administrator comment, review timestamps, and the administrator who performed the review. This design models the real platform behavior more accurately than storing only a small number of fixed document URLs directly on the caregiver profile.
```

- [ ] **Step 2: Update the ERD/TikZ figure**

Add a new entity box in the ERD:

```tex
\node[entity, text width=4.1cm] (verdocs) at (0,-9.4) {verification\_documents\\caregiverProfileId, documentType\\fileUrl, status\\adminComment, reviewedAt};
\draw[arr] (caregiverp) -- (verdocs);
```

Adjust the `\resizebox` or coordinates as needed so the figure remains readable.

- [ ] **Step 3: Update the feature description**

Replace the current simplified verification paragraph with wording that matches the implementation:

```tex
Caregivers upload identification and qualification files through their profile page. Each uploaded file becomes a separate verification record. Administrators then inspect these files manually, approve or reject them, and can leave a comment explaining the decision. The caregiver's overall verification status is derived from the reviewed documents rather than from a single profile flag alone.
```

- [ ] **Step 4: Update the workflow description**

Add a short flow note in the workflow section:

```tex
The verification workflow is manual by design. The system stores uploaded files and review metadata, but the final verification decision is made by an administrator who inspects the submitted documents visually.
```

- [ ] **Step 5: Review formatting**

Open the `.tex` file and confirm:

- no new oversized TikZ boxes
- no overlapping labels
- the new verification text matches the implemented backend behavior

- [ ] **Step 6: Commit**

```bash
git add C:\Users\Admin\Desktop\Qamqorhy\diploma\chapter3_design_methodology.tex
git commit -m "docs: update chapter 3 for verification document workflow"
```

---

### Task 10: Final verification

**Files:**
- Verify backend and frontend working tree after all prior tasks

- [ ] **Step 1: Run backend syntax verification**

Run: `python -m compileall C:\Users\Admin\Desktop\Qamqorhy\backend_fastapi`

Expected: backend compiles with no syntax errors.

- [ ] **Step 2: Run frontend lint**

Run: `npm run lint`

Expected: lint succeeds or reports only pre-existing unrelated issues.

- [ ] **Step 3: Manual smoke checklist**

Verify these flows:

- caregiver opens profile and sees verification section
- caregiver uploads an ID card
- admin sees the uploaded document
- admin approves or rejects with comment
- caregiver sees updated status and comment
- caregiver profile overall verification status updates correctly

- [ ] **Step 4: Commit final integration**

```bash
git add .
git commit -m "feat: implement manual caregiver verification workflow"
```

---

## Self-Review

### Spec coverage

Covered:

- dedicated verification documents table
- manual admin review with comments
- caregiver upload/list flow
- admin list/review flow
- profile verification state recalculation
- diploma Chapter 3 updates

Out of scope by design:

- automatic OCR/image recognition
- localization cleanup
- phone number normalization
- full mobile responsiveness audit

### Placeholder scan

The only variable left is the Alembic revision filename and revision id, which must be filled with the generated migration identifier during implementation. All functional steps, paths, commands, and code snippets are otherwise concrete.

### Type consistency

The plan consistently uses:

- `VerificationDocumentType`
- `VerificationDocumentStatus`
- `VerificationDocument`
- `VerificationDocumentSchema`
- `VerificationDocumentReviewRequest`

The profile-level status remains `VerificationStatus` on `CaregiverProfile`.
