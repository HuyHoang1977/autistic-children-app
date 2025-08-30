"""Add article management fields for admin review

Revision ID: add_article_management
Revises: previous_revision_id
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_article_management'
down_revision = 'previous_revision_id'  # Replace with your last migration ID
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to articles table for admin management
    op.add_column('articles', sa.Column('rejection_reason', sa.Text(), nullable=True))
    op.add_column('articles', sa.Column('admin_notes', sa.Text(), nullable=True))
    op.add_column('articles', sa.Column('reviewed_at', sa.DateTime(), nullable=True))
    op.add_column('articles', sa.Column('reviewed_by', sa.Integer(), nullable=True))
    op.add_column('articles', sa.Column('approval_priority', sa.Integer(), nullable=True, default=0))

    # Add foreign key for reviewed_by (admin who reviewed)
    op.create_foreign_key(
        'fk_articles_reviewed_by_users',
        'articles', 'users',
        ['reviewed_by'], ['user_id']
    )

    # Add index for common queries
    op.create_index('idx_articles_status_created', 'articles', ['status', 'created_at'])
    op.create_index('idx_articles_reviewed_at', 'articles', ['reviewed_at'])
    op.create_index('idx_articles_priority', 'articles', ['approval_priority'])

    # Update existing articles to have 'pending' status if they're in draft
    # and were created by non-admin users
    op.execute("""
        UPDATE articles 
        SET status = 'pending' 
        WHERE status = 'draft' 
        AND author_id IN (
            SELECT user_id FROM users WHERE role_id != 1
        )
    """)


def downgrade():
    # Remove indexes
    op.drop_index('idx_articles_priority', table_name='articles')
    op.drop_index('idx_articles_reviewed_at', table_name='articles')
    op.drop_index('idx_articles_status_created', table_name='articles')

    # Remove foreign key
    op.drop_constraint('fk_articles_reviewed_by_users', 'articles', type_='foreignkey')

    # Remove columns
    op.drop_column('articles', 'approval_priority')
    op.drop_column('articles', 'reviewed_by')
    op.drop_column('articles', 'reviewed_at')
    op.drop_column('articles', 'admin_notes')
    op.drop_column('articles', 'rejection_reason')