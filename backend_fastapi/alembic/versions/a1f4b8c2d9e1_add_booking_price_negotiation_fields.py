"""Add booking price negotiation fields

Revision ID: a1f4b8c2d9e1
Revises: c54c4499be1c
Create Date: 2026-04-02 19:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1f4b8c2d9e1'
down_revision: Union[str, None] = 'c54c4499be1c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


user_role_enum = postgresql.ENUM('CLIENT', 'CAREGIVER', 'ADMIN', name='userrole', create_type=False)


def upgrade() -> None:
    op.add_column('bookings', sa.Column('lastPriceProposedBy', user_role_enum, nullable=True))
    op.add_column('bookings', sa.Column('priceProposedAt', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('bookings', 'priceProposedAt')
    op.drop_column('bookings', 'lastPriceProposedBy')
