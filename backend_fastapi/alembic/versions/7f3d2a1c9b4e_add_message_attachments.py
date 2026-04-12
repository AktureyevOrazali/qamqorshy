"""Add message attachments

Revision ID: 7f3d2a1c9b4e
Revises: b7e2c1f49c0a
Create Date: 2026-04-09 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7f3d2a1c9b4e'
down_revision: Union[str, None] = 'b7e2c1f49c0a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('messages', sa.Column('attachmentUrl', sa.String(), nullable=True))
    op.add_column('messages', sa.Column('attachmentMimeType', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('messages', 'attachmentMimeType')
    op.drop_column('messages', 'attachmentUrl')

