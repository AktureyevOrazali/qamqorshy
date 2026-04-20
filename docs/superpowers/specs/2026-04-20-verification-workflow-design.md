# Verification Workflow Design

## Goal

Implement a proper manual caregiver document verification workflow for Qamqorhy.

Today, the project only stores caregiver verification-related fields directly on the caregiver profile. That is enough for a rough prototype, but it does not model the real review process clearly. The improved design should let caregivers upload verification documents, let admins review each document manually, and preserve the review decision with a comment and timestamps.

This design also improves the diploma documentation because the data model and workflow become more realistic and easier to explain.

## Scope

This spec covers only the first subproject:

- add a dedicated verification documents data model
- add backend upload/list/review routes
- update caregiver verification logic
- update the frontend caregiver profile and admin review flow
- update Chapter 3 documentation after implementation

This spec does not include:

- automatic OCR or AI-based document recognition
- full localization cleanup
- full mobile responsiveness audit
- phone number validation and normalization

Those will be handled as separate follow-up subprojects.

## Current Problem

The current project keeps document-related fields such as `idCardUrl`, `diplomaUrl`, and a single `verificationStatus` on `caregiver_profiles`. That creates several limits:

- the schema assumes a fixed number of document slots
- the admin review action is not modeled as its own workflow
- there is no per-document status
- there is no durable admin comment per reviewed document
- it is harder to explain in the diploma as a real review process

The platform does not currently perform actual automated photo or document verification. The real logic is manual: caregivers upload files, and admins inspect them visually. The system should represent that honestly.

## Recommended Approach

Use a separate `verification_documents` table and keep verification manual.

Each uploaded document becomes its own record with:

- caregiver owner
- document type
- file location
- review status
- admin comment
- review metadata

This approach is better than continuing to store everything on `caregiver_profiles` because it keeps profile data separate from review workflow data. It also scales more naturally if the platform later supports more document types or re-uploads.

## Alternatives Considered

### Option 1: Keep everything on `caregiver_profiles`

Pros:

- minimal database change
- fastest to implement

Cons:

- poor scalability
- weak auditability
- awkward to support more documents or replacement flows
- less credible for diploma documentation

### Option 2: Add `verification_documents` table

Pros:

- clean data model
- realistic workflow
- stronger admin panel design
- stronger ERD and documentation
- easier future expansion

Cons:

- more backend and frontend work than option 1

### Option 3: Add document table plus review-history table

Pros:

- strongest audit trail
- ideal for larger production systems

Cons:

- too heavy for the current project stage
- unnecessary complexity for the diploma scope

## Final Decision

Choose option 2.

Add a dedicated `verification_documents` table and keep the review process manual with admin comments.

## Data Model

### Existing Table Kept

`caregiver_profiles`

This remains the main place for caregiver information such as:

- bio
- experience years
- hourly rate
- categories
- overall verification status

### New Table

`verification_documents`

Suggested fields:

- `id`
- `caregiverProfileId`
- `documentType`
- `fileUrl`
- `originalFileName`
- `mimeType`
- `status`
- `adminComment`
- `reviewedByUserId`
- `reviewedAt`
- `createdAt`
- `updatedAt`

### Suggested Enums

Document type:

- `ID_CARD`
- `DIPLOMA`
- `CERTIFICATE`

Document status:

- `PENDING`
- `APPROVED`
- `REJECTED`

### Relationships

- one caregiver profile can have many verification documents
- one admin user can review many verification documents
- each verification document belongs to exactly one caregiver profile

## Verification Rules

The platform should not claim to verify files automatically.

The real rule set should be:

1. caregiver uploads one or more required documents
2. each new document starts with `PENDING`
3. admin reviews the uploaded file manually
4. admin sets `APPROVED` or `REJECTED`
5. admin can leave a comment such as `blurry image` or `missing diploma page`
6. caregiver profile verification status is recalculated from document states

Recommended overall caregiver profile logic:

- `UNVERIFIED` if required documents were never uploaded
- `PENDING` if documents were uploaded but final approval is not complete
- `VERIFIED` if all required documents are approved

If a document is rejected, the caregiver should remain `PENDING` until the document is replaced or approved. This is more accurate than switching back to `UNVERIFIED`, because the caregiver is already inside the review flow.

## Backend API Design

### Caregiver-Facing Routes

`POST /api/profile/verification-documents`

- upload a file
- create a `verification_documents` record
- mark document status as `PENDING`
- recalculate caregiver profile verification state

`GET /api/profile/verification-documents`

- return all current user verification documents
- include review status and admin comment

`DELETE /api/profile/verification-documents/{id}`

- optional but recommended
- allow caregiver to remove an incorrect upload before or after review

### Admin-Facing Routes

`GET /api/caregivers/admin/verification-documents`

- list uploaded documents for review
- optionally filter by `PENDING`

`PATCH /api/caregivers/admin/verification-documents/{id}`

- update document status to `APPROVED` or `REJECTED`
- save `adminComment`
- save `reviewedByUserId`
- save `reviewedAt`
- recalculate caregiver profile verification state

## Frontend Design

### Caregiver Side

The caregiver profile page should gain a document verification section.

It should allow the caregiver to:

- see required document types
- upload files
- view current review status
- read admin comments on rejected files

The UI should make the workflow obvious:

- uploaded and waiting
- approved
- rejected with comment

### Admin Side

The admin panel should gain a clearer document review queue.

Each row or card should show:

- caregiver name
- document type
- uploaded file preview or link
- current status
- admin comment field
- approve and reject actions

This is better than reviewing only a coarse caregiver profile state because the admin can judge each document directly.

## Data Flow

1. Caregiver uploads file from profile page.
2. Backend stores file and creates a `verification_documents` row.
3. Document status becomes `PENDING`.
4. Caregiver profile verification state becomes `PENDING` if it was previously `UNVERIFIED`.
5. Admin opens the review queue.
6. Admin reviews the file manually.
7. Admin approves or rejects and adds a comment.
8. Backend updates review metadata and recalculates the caregiver profile state.
9. Frontend reflects the current result to both caregiver and admin.

## Error Handling

The implementation should handle these cases clearly:

- unsupported file type
- empty upload
- oversized file
- unauthorized access
- admin trying to review a non-existent document
- caregiver trying to delete another user’s document
- invalid review status

Responses should remain consistent with the rest of the API and should use typed request models instead of loose dictionaries.

## Testing

Testing should cover:

- caregiver uploads valid document
- caregiver uploads invalid file type
- caregiver lists own documents
- admin lists pending documents
- admin approves a document
- admin rejects a document with comment
- caregiver profile status recalculates correctly
- unauthorized user cannot review documents
- unauthorized user cannot access another caregiver’s documents

## Documentation Impact

After implementation, Chapter 3 should be updated in these places:

- database scheme should include `verification_documents`
- workflow section should describe manual upload and admin review
- functionality section should explain document review with comments
- data integrity section should mention review metadata and per-document status

The documentation should explicitly state that the project implements manual admin verification, not automatic computer vision verification.

## Follow-Up Subprojects

After this verification workflow is complete, the recommended order is:

1. phone number validation and normalization
2. localization cleanup
3. mobile responsiveness review

This order gives the best balance between backend correctness, user-facing polish, and documentation accuracy.
