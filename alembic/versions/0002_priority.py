"""add priority to jobs"""

from alembic import op
import sqlalchemy as sa

revision = "0002_priority"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("priority", sa.String(length=16), nullable=True))


def downgrade() -> None:
    op.drop_column("jobs", "priority")
