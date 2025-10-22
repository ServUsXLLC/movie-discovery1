"""Add jti and expires_at to refresh_tokens (PostgreSQL fast version)

Revision ID: 0437e29a0d58
Revises: 90b18eca6bff
Create Date: 2025-10-19 22:50:00
"""

from alembic import op
import sqlalchemy as sa
from datetime import timedelta
from app.config import settings

revision = '0437e29a0d58'
down_revision = '90b18eca6bff'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1️⃣ Add columns without constraints
    op.add_column('refresh_tokens', sa.Column('jti', sa.String(), nullable=True))
    op.add_column('refresh_tokens', sa.Column('expires_at', sa.DateTime(), nullable=True))

    # 2️⃣ Populate columns using PostgreSQL functions
    default_expire_days = getattr(settings, 'refresh_token_expire_days', 7)
    op.execute(f"""
        UPDATE refresh_tokens
        SET jti = gen_random_uuid()::text,
            expires_at = now() + interval '{default_expire_days} days'
    """)

    # 3️⃣ Alter columns to be non-nullable
    op.alter_column('refresh_tokens', 'jti', nullable=False)
    op.alter_column('refresh_tokens', 'expires_at', nullable=False)

    # 4️⃣ Add unique constraint to jti
    op.create_unique_constraint("uq_refresh_tokens_jti", "refresh_tokens", ["jti"])


def downgrade() -> None:
    op.drop_constraint("uq_refresh_tokens_jti", "refresh_tokens", type_="unique")
    op.drop_column('refresh_tokens', 'jti')
    op.drop_column('refresh_tokens', 'expires_at')
