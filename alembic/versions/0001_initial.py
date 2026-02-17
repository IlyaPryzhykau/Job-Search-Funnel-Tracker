"""initial schema"""

from datetime import datetime
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "stages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("is_terminal", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_stages_name", "stages", ["name"], unique=True)
    op.create_index("ix_stages_order_index", "stages", ["order_index"])

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=True),
        sa.Column("provider", sa.String(length=32), nullable=True),
        sa.Column("provider_sub", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company", sa.String(length=128), nullable=False),
        sa.Column("position", sa.String(length=128), nullable=False),
        sa.Column("source", sa.String(length=64), nullable=True),
        sa.Column("salary", sa.String(length=64), nullable=True),
        sa.Column("stack", sa.String(length=128), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("stage_id", sa.Integer(), nullable=False),
        sa.Column("applied_at", sa.DateTime(), nullable=True),
        sa.Column("hr_response_at", sa.DateTime(), nullable=True),
        sa.Column("screening_at", sa.DateTime(), nullable=True),
        sa.Column("tech_interview_at", sa.DateTime(), nullable=True),
        sa.Column("homework_at", sa.DateTime(), nullable=True),
        sa.Column("final_at", sa.DateTime(), nullable=True),
        sa.Column("offer_at", sa.DateTime(), nullable=True),
        sa.Column("rejected_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["stage_id"], ["stages.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index("ix_jobs_company", "jobs", ["company"])
    op.create_index("ix_jobs_position", "jobs", ["position"])
    op.create_index("ix_jobs_user_id", "jobs", ["user_id"])

    now = datetime.utcnow()
    stages_table = sa.table(
        "stages",
        sa.column("name", sa.String),
        sa.column("order_index", sa.Integer),
        sa.column("is_terminal", sa.Boolean),
        sa.column("created_at", sa.DateTime),
    )
    op.bulk_insert(
        stages_table,
        [
            {"name": "Applied", "order_index": 1, "is_terminal": False, "created_at": now},
            {"name": "HR Response", "order_index": 2, "is_terminal": False, "created_at": now},
            {"name": "Screening", "order_index": 3, "is_terminal": False, "created_at": now},
            {"name": "Tech Interview", "order_index": 4, "is_terminal": False, "created_at": now},
            {"name": "Homework", "order_index": 5, "is_terminal": False, "created_at": now},
            {"name": "Final", "order_index": 6, "is_terminal": False, "created_at": now},
            {"name": "Offer", "order_index": 7, "is_terminal": True, "created_at": now},
            {"name": "Rejected", "order_index": 8, "is_terminal": True, "created_at": now},
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_jobs_user_id", table_name="jobs")
    op.drop_index("ix_jobs_position", table_name="jobs")
    op.drop_index("ix_jobs_company", table_name="jobs")
    op.drop_table("jobs")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    op.drop_index("ix_stages_order_index", table_name="stages")
    op.drop_index("ix_stages_name", table_name="stages")
    op.drop_table("stages")
