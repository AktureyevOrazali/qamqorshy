"""Add booking address field

Revision ID: b7e2c1f49c0a
Revises: a1f4b8c2d9e1
Create Date: 2026-04-02
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b7e2c1f49c0a'
down_revision = 'a1f4b8c2d9e1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('bookings', sa.Column('address', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('bookings', 'address')
