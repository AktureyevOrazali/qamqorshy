"""add verification documents

Revision ID: d31b9af4c2e7
Revises: 7f3d2a1c9b4e
Create Date: 2026-04-20 18:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d31b9af4c2e7"
down_revision: Union[str, None] = "7f3d2a1c9b4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    verification_document_type = sa.Enum(
        "ID_CARD",
        "DIPLOMA",
        "CERTIFICATE",
        name="verificationdocumenttype",
    )
    verification_document_status = sa.Enum(
        "PENDING",
        "APPROVED",
        "REJECTED",
        name="verificationdocumentstatus",
    )

    verification_document_type.create(op.get_bind(), checkfirst=False)
    verification_document_status.create(op.get_bind(), checkfirst=False)

    op.create_table(
        "verification_documents",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("caregiverProfileId", sa.String(length=36), nullable=False),
        sa.Column("documentType", verification_document_type, nullable=False),
        sa.Column("fileUrl", sa.String(), nullable=False),
        sa.Column("originalFileName", sa.String(), nullable=True),
        sa.Column("mimeType", sa.String(), nullable=True),
        sa.Column("status", verification_document_status, nullable=False),
        sa.Column("adminComment", sa.String(), nullable=True),
        sa.Column("reviewedByUserId", sa.String(length=36), nullable=True),
        sa.Column("reviewedAt", sa.DateTime(timezone=True), nullable=True),
        sa.Column("createdAt", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updatedAt", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["caregiverProfileId"], ["caregiver_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewedByUserId"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_verification_documents_caregiverProfileId"),
        "verification_documents",
        ["caregiverProfileId"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_verification_documents_caregiverProfileId"), table_name="verification_documents")
    op.drop_table("verification_documents")
    sa.Enum(name="verificationdocumentstatus").drop(op.get_bind(), checkfirst=False)
    sa.Enum(name="verificationdocumenttype").drop(op.get_bind(), checkfirst=False)
