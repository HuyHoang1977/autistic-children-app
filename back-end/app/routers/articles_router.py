# app/routers/articles_router.py - UPDATED with notification system
import logging
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.articles_model import Article
from app.models.users_model import User
from app.services.minio_service import minio_service
from app.services.article_notification_service import trigger_article_notification
from app.extensions import db
from datetime import datetime
from werkzeug.utils import secure_filename

# ✅ Import relationship models (add these safely)
try:
    from app.models.categories_model import Category
    from app.models.article_categories_model import ArticleCategory

    CATEGORIES_AVAILABLE = True
except ImportError:
    CATEGORIES_AVAILABLE = False

try:
    from app.models.tags_model import Tag
    from app.models.article_tags_model import ArticleTag

    TAGS_AVAILABLE = True
except ImportError:
    TAGS_AVAILABLE = False

logger = logging.getLogger(__name__)
bp = Blueprint('articles', __name__)


def get_user_id_from_jwt():
    """Helper function to get user_id from JWT"""
    try:
        current_user_identity = get_jwt_identity()
        if isinstance(current_user_identity, str):
            return int(current_user_identity)
        return current_user_identity
    except (ValueError, TypeError):
        return None


# ✅ CORS preflight handlers
def cors_preflight_response():
    """Common CORS preflight response"""
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response, 200


@bp.route('', methods=['OPTIONS'])
@bp.route('/', methods=['OPTIONS'])
def articles_list_options():
    """Handle CORS preflight requests for articles list"""
    return cors_preflight_response()


@bp.route('/<int:article_id>', methods=['OPTIONS'])
def article_detail_options(article_id):
    """Handle CORS preflight requests for article detail"""
    return cors_preflight_response()


def create_category_relationship(article_id, category_name):
    """Helper function to create category relationship safely"""
    if not CATEGORIES_AVAILABLE or not category_name:
        return False

    try:
        # Find or create category
        category = db.session.query(Category).filter_by(
            name=category_name,
            is_active=True
        ).first()

        if not category:
            category = Category(
                name=category_name,
                description=f"Auto-created category: {category_name}",
                is_active=True,
                sort_order=0
            )
            db.session.add(category)
            db.session.flush()

        # Create article-category relationship
        existing = db.session.query(ArticleCategory).filter_by(
            article_id=article_id,
            category_id=category.category_id
        ).first()

        if not existing:
            article_category = ArticleCategory(
                article_id=article_id,
                category_id=category.category_id
            )
            db.session.add(article_category)

        return True
    except Exception as e:
        logger.warning(f'⚠️ Failed to create category relationship: {str(e)}')
        return False


def create_tag_relationships(article_id, tags_string):
    """Helper function to create tag relationships safely"""
    if not TAGS_AVAILABLE or not tags_string:
        return False

    try:
        # Parse tags
        tag_names = [tag.strip() for tag in tags_string.split(',') if tag.strip()]

        for tag_name in tag_names:
            # Find or create tag
            tag = db.session.query(Tag).filter_by(name=tag_name).first()

            if not tag:
                tag = Tag(
                    name=tag_name,
                    description=f"Auto-created tag: {tag_name}",
                    is_active=True,
                    usage_count=0
                )
                db.session.add(tag)
                db.session.flush()

            # Create article-tag relationship
            existing = db.session.query(ArticleTag).filter_by(
                article_id=article_id,
                tag_id=tag.tag_id
            ).first()

            if not existing:
                article_tag = ArticleTag(
                    article_id=article_id,
                    tag_id=tag.tag_id
                )
                db.session.add(article_tag)

                # Increment usage count
                tag.usage_count = (tag.usage_count or 0) + 1

        return True
    except Exception as e:
        logger.warning(f'⚠️ Failed to create tag relationships: {str(e)}')
        return False


# app/routers/articles_router.py - Cập nhật hàm create_article

def determine_article_status(user_role_id, is_draft=False):
    """Determine article status based on user role and draft status"""
    if is_draft:
        return 'draft'

    # Admin articles can be published immediately
    if user_role_id == 1:
        return 'published'

    # Doctor and Parent articles need approval
    return 'pending'


@bp.route('', methods=['POST'])
@bp.route('/', methods=['POST'])
@jwt_required()
def create_article():
    """Create article with JSON data and notification system"""
    logger.info('=== CREATE ARTICLE START ===')

    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity',
                'error_code': 'INVALID_USER_IDENTITY'
            }), 422

        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided',
                'error_code': 'NO_DATA'
            }), 400

        # Extract and validate article data
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        excerpt = data.get('excerpt', '').strip()
        category = data.get('category', '').strip()
        tags = data.get('tags', '').strip()
        is_draft = data.get('is_draft', False)
        featured_image = data.get('featured_image', '').strip()
        meta_description = data.get('meta_description', '').strip()

        # Validation
        if not title:
            return jsonify({
                'success': False,
                'error': 'Title is required',
                'error_code': 'MISSING_TITLE'
            }), 400

        if not content:
            return jsonify({
                'success': False,
                'error': 'Content is required',
                'error_code': 'MISSING_CONTENT'
            }), 400

        # Get user info for status determination
        user = db.session.query(User).filter_by(user_id=current_user_id).first()
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found',
                'error_code': 'USER_NOT_FOUND'
            }), 404

        # Determine article status
        status = determine_article_status(user.role_id, is_draft)

        # Auto-generate excerpt if not provided
        if not excerpt and content:
            excerpt = content[:200] + ('...' if len(content) > 200 else '')

        # ✅ Create article with SAFE parameters only
        try:
            article = Article(
                title=title,
                content=content,
                content_body=content,
                excerpt=excerpt,
                featured_image_url=featured_image,
                featured_image=featured_image,
                author_id=current_user_id,
                status=status,
                featured=False,  # Only admin can set featured
                meta_description=meta_description,
                allow_comments=True,
                category=category,
                tags=tags
            )

            # Set published_at and article_status based on status
            if status == 'published':
                article.published_at = datetime.utcnow()
                article.article_status = 2
            elif status == 'pending':
                article.article_status = 1
            else:  # draft
                article.article_status = 0

            # Save article
            db.session.add(article)
            db.session.commit()

            logger.info(f'✅ Article created with ID: {article.article_id}, Status: {status}')

            if category:
                if create_category_relationship(article.article_id, category):
                    relationships_created.append(f'category: {category}')
                    logger.info(f'✅ Category relationship created: {category}')

            if tags:
                if create_tag_relationships(article.article_id, tags):
                    relationships_created.append(f'tags: {tags}')
                    logger.info(f'✅ Tag relationships created: {tags}')

            # Commit relationships
            if relationships_created:
                try:
                    db.session.commit()
                    logger.info(f'✅ Relationships committed: {", ".join(relationships_created)}')
                except Exception as rel_error:
                    logger.warning(f'⚠️ Relationship commit failed: {str(rel_error)}')
                    # Don't rollback article, just continue

            # ✅ Create notifications for followers if article is published
            if status == 'published':
                try:
                    from app.services.notification_service import NotificationService
                    notification_service = NotificationService()
                    notification_result = notification_service.create_new_article_notifications(
                        article_id=article.article_id,
                        article_title=article.title,
                        doctor_user_id=current_user_id
                    )
                    if notification_result.get('success'):
                        logger.info(f'✅ Created {notification_result.get("notifications_created", 0)} notifications for article {article.article_id}')
                    else:
                        logger.warning(f'⚠️ Failed to create notifications: {notification_result.get("message", "Unknown error")}')
                except Exception as notification_error:
                    logger.warning(f'⚠️ Notification creation failed: {str(notification_error)}')
                    # Don't fail the entire request, just log the error

            # ✅ Get created article with author info for response

            created_article = db.session.query(Article).filter(
                Article.article_id == article.article_id
            ).first()

            article_data = created_article.to_dict(include_content=True)

            return jsonify({
                'success': True,
                'data': article_data,
                'message': f'Article {"saved as draft" if status == "draft" else "submitted for review" if status == "pending" else "published"} successfully',
                'status': status
            }), 201

        except Exception as db_error:
            db.session.rollback()
            logger.error(f'❌ Database error: {str(db_error)}', exc_info=True)
            return jsonify({
                'success': False,
                'error': f'Failed to save article: {str(db_error)}',
                'error_code': 'DATABASE_ERROR'
            }), 500

    except Exception as e:
        logger.error(f'❌ Unexpected error in create_article: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Unexpected server error: {str(e)}',
            'error_code': 'UNEXPECTED_ERROR'
        }), 500

# ✅ ENHANCED: Update Article with Status Management
@bp.route('/<int:article_id>', methods=['PUT'])
@jwt_required()
def update_article(article_id):
    """Update article with proper status management"""
    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity',
                'error_code': 'INVALID_USER_IDENTITY'
            }), 422

        # Get existing article
        article = db.session.query(Article).filter_by(article_id=article_id).first()
        if not article:
            return jsonify({
                'success': False,
                'error': 'Article not found',
                'error_code': 'ARTICLE_NOT_FOUND'
            }), 404

        # Check ownership
        if article.author_id != current_user_id:
            return jsonify({
                'success': False,
                'error': 'You can only edit your own articles',
                'error_code': 'PERMISSION_DENIED'
            }), 403

        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided',
                'error_code': 'NO_DATA'
            }), 400

        # Get user info for status determination
        user = db.session.query(User).filter_by(user_id=current_user_id).first()
        old_status = article.status

        # Update fields
        if 'title' in data:
            title = data['title'].strip()
            if not title:
                return jsonify({
                    'success': False,
                    'error': 'Title cannot be empty',
                    'error_code': 'INVALID_TITLE'
                }), 400
            article.title = title

        if 'content' in data:
            content = data['content'].strip()
            if not content:
                return jsonify({
                    'success': False,
                    'error': 'Content cannot be empty',
                    'error_code': 'INVALID_CONTENT'
                }), 400
            article.content = content
            article.content_body = content

            # Recalculate reading time
            word_count = len(content.split())
            article.reading_time = max(1, round(word_count / 225))

        if 'excerpt' in data:
            article.excerpt = data['excerpt'].strip()

        if 'category' in data:
            article.category = data['category'].strip()

        if 'tags' in data:
            article.tags = data['tags'].strip()

        if 'featured_image' in data:
            article.featured_image = data['featured_image'].strip()
            article.featured_image_url = data['featured_image'].strip()

        if 'meta_description' in data:
            article.meta_description = data['meta_description'].strip()

        # Handle status changes
        is_draft = data.get('is_draft', False)
        submit_for_review = data.get('submit_for_review', False)

        if submit_for_review and not is_draft:
            # Submit for review (only if not admin)
            if user.role_id != 1:
                article.status = 'pending'
                article.article_status = 1
                article.published_at = None

                # Clear rejection reason if resubmitting
                if hasattr(article, 'rejection_reason'):
                    article.rejection_reason = None
                if hasattr(article, 'admin_notes'):
                    article.admin_notes = None

                # Trigger notification if status changed to pending
                if old_status != 'pending':
                    try:
                        import asyncio
                        asyncio.create_task(trigger_article_notification('submitted', article))
                    except Exception as notif_error:
                        logger.warning(f'⚠️ Notification failed: {str(notif_error)}')
            else:
                # Admin can publish immediately
                article.status = 'published'
                article.article_status = 2
                article.published_at = datetime.utcnow()

        elif is_draft:
            # Save as draft
            article.status = 'draft'
            article.article_status = 0
            article.published_at = None

        # Update timestamp
        article.updated_at = datetime.utcnow()

        db.session.commit()

        # Return updated article
        updated_article = article.to_dict(include_content=True)

        logger.info(f'✅ Article {article_id} updated by user {current_user_id}')

        return jsonify({
            'success': True,
            'data': updated_article,
            'message': f'Article {"saved as draft" if article.status == "draft" else "submitted for review" if article.status == "pending" else "updated"} successfully',
            'status_changed': old_status != article.status
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f'❌ Error updating article: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to update article: {str(e)}',
            'error_code': 'UPDATE_ERROR'
        }), 500


# ✅ GET User's Articles with Status Filter
@bp.route('/my-articles', methods=['GET'])
@jwt_required()
def get_my_articles():
    """Get current user's articles with status filtering"""
    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity'
            }), 422

        # Get query parameters
        page = request.args.get('page', default=1, type=int)
        limit = request.args.get('limit', default=10, type=int)
        status = request.args.get('status', '').strip()
        search = request.args.get('search', '').strip()

        # Build query
        query = db.session.query(Article).filter_by(author_id=current_user_id)

        # Apply filters
        if status:
            query = query.filter(Article.status == status)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Article.title.ilike(search_term),
                    Article.content.ilike(search_term),
                    Article.excerpt.ilike(search_term)
                )
            )

        # Order by creation date (newest first)
        query = query.order_by(Article.created_at.desc())

        # Get total count
        total_count = query.count()

        # Apply pagination
        offset = (page - 1) * limit
        articles = query.offset(offset).limit(limit).all()

        # Format response
        articles_data = []
        for article in articles:
            article_data = article.to_dict(include_content=False)
            articles_data.append(article_data)

        # Calculate pagination info
        total_pages = (total_count + limit - 1) // limit
        has_more = offset + limit < total_count

        return jsonify({
            'success': True,
            'data': articles_data,
            'pagination': {
                'current_page': page,
                'per_page': limit,
                'total': total_count,
                'total_pages': total_pages,
                'has_more': has_more
            }
        }), 200

    except Exception as e:
        logger.error(f'❌ Error getting user articles: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to get user articles: {str(e)}'
        }), 500


# ✅ RESUBMIT Rejected Article
@bp.route('/<int:article_id>/resubmit', methods=['POST'])
@jwt_required()
def resubmit_article(article_id):
    """Resubmit a rejected article for review"""
    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity'
            }), 422

        # Get article
        article = db.session.query(Article).filter_by(article_id=article_id).first()
        if not article:
            return jsonify({
                'success': False,
                'error': 'Article not found'
            }), 404

        # Check ownership
        if article.author_id != current_user_id:
            return jsonify({
                'success': False,
                'error': 'You can only resubmit your own articles'
            }), 403

        # Check if article can be resubmitted
        if article.status not in ['rejected', 'draft']:
            return jsonify({
                'success': False,
                'error': 'Only rejected or draft articles can be resubmitted'
            }), 400

        # Update status to pending
        article.status = 'pending'
        article.article_status = 1
        article.updated_at = datetime.utcnow()

        # Clear rejection reason
        if hasattr(article, 'rejection_reason'):
            article.rejection_reason = None
        if hasattr(article, 'admin_notes'):
            article.admin_notes = None

        db.session.commit()

        # Trigger notification
        try:
            import asyncio
            asyncio.create_task(trigger_article_notification('submitted', article))
        except Exception as notif_error:
            logger.warning(f'⚠️ Notification failed: {str(notif_error)}')

        logger.info(f'✅ Article {article_id} resubmitted by user {current_user_id}')

        return jsonify({
            'success': True,
            'message': 'Article resubmitted for review successfully',
            'data': {
                'article_id': article_id,
                'status': 'pending'
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f'❌ Error resubmitting article: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to resubmit article: {str(e)}'
        }), 500


# ✅ Keep all other existing endpoints from the original file
@bp.route('', methods=['GET'])
@bp.route('/', methods=['GET'])
@jwt_required()
def get_articles():
    """Get paginated articles with JWT authentication"""
    logger.info('=== GET ARTICLES START ===')

    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity',
                'error_code': 'INVALID_USER_IDENTITY'
            }), 422

        # Get parameters
        limit = request.args.get('limit', default=10, type=int)
        page = request.args.get('page', default=1, type=int)
        category = request.args.get('category', '').strip()
        status = request.args.get('status', 'published').strip()
        author_id = request.args.get('author_id', type=int)
        featured = request.args.get('featured', type=bool)
        search = request.args.get('search', '').strip()
        sort_by = request.args.get('sort_by', 'published_at').strip()
        sort_order = request.args.get('sort_order', 'desc').strip()

        # Validate parameters
        if not (1 <= limit <= 100):
            limit = 10
        if page < 1:
            page = 1

        # Build query
        query = db.session.query(Article)

        # Apply filters
        if status:
            query = query.filter(Article.status == status)
        if category:
            query = query.filter(Article.category == category)
        if author_id:
            query = query.filter(Article.author_id == author_id)
        if featured is not None:
            query = query.filter(Article.featured == featured)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Article.title.ilike(search_term),
                    Article.content.ilike(search_term),
                    Article.excerpt.ilike(search_term)
                )
            )

        # Apply sorting
        if sort_by == 'published_at':
            order_col = Article.published_at.desc() if sort_order == 'desc' else Article.published_at.asc()
        elif sort_by == 'created_at':
            order_col = Article.created_at.desc() if sort_order == 'desc' else Article.created_at.asc()
        elif sort_by == 'likes':
            order_col = Article.like_count.desc() if sort_order == 'desc' else Article.like_count.asc()
        elif sort_by == 'views':
            order_col = Article.views.desc() if sort_order == 'desc' else Article.views.asc()
        else:
            order_col = Article.published_at.desc()

        query = query.order_by(order_col)

        # Get total count
        total_count = query.count()

        # Apply pagination
        offset = (page - 1) * limit
        articles = query.offset(offset).limit(limit).all()

        # Serialize articles with author info
        paginated_articles = []
        for article in articles:
            try:
                # Get author info if needed
                if not hasattr(article, 'author') or not article.author:
                    author = db.session.query(User).filter_by(user_id=article.author_id).first()
                    if author:
                        article.author = author

                article_data = article.to_dict(include_content=False)
                paginated_articles.append(article_data)

            except Exception as article_error:
                logger.error(f'❌ Failed to serialize article {article.article_id}: {str(article_error)}')
                continue

        # Calculate pagination info
        total_pages = (total_count + limit - 1) // limit
        has_more = offset + limit < total_count

        response_data = {
            'success': True,
            'data': paginated_articles,
            'pagination': {
                'current_page': page,
                'per_page': limit,
                'total': total_count,
                'total_pages': total_pages,
                'has_more': has_more
            },
            'filters': {
                'status': status,
                'category': category,
                'author_id': author_id,
                'featured': featured,
                'search': search,
                'sort_by': sort_by,
                'sort_order': sort_order
            }
        }

        logger.info(f'✅ Returned {len(paginated_articles)} articles (page {page}/{total_pages})')
        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f'❌ Error in get_articles: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to get articles: {str(e)}',
            'error_code': 'UNEXPECTED_ERROR'
        }), 500


# ✅ Get Article Detail
@bp.route('/<int:article_id>', methods=['GET'])
@jwt_required()
def get_article_detail(article_id):
    """Get article detail by ID with full content"""
    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity',
                'error_code': 'INVALID_USER_IDENTITY'
            }), 422

        logger.info(f'🔍 Getting article detail: {article_id} for user: {current_user_id}')

        # Get article
        article = db.session.query(Article).filter_by(article_id=article_id).first()

        if not article:
            logger.warning(f'❌ Article not found: {article_id}')
            return jsonify({
                'success': False,
                'error': 'Article not found',
                'error_code': 'ARTICLE_NOT_FOUND'
            }), 404

        # Check if user can view this article
        if article.status != 'published' and article.author_id != current_user_id:
            # Only author and admin can view unpublished articles
            user = db.session.query(User).filter_by(user_id=current_user_id).first()
            if not user or user.role_id != 1:  # Not admin
                return jsonify({
                    'success': False,
                    'error': 'Article not accessible',
                    'error_code': 'ARTICLE_NOT_ACCESSIBLE'
                }), 403

        # Get author info
        if not hasattr(article, 'author') or not article.author:
            author = db.session.query(User).filter_by(user_id=article.author_id).first()
            if author:
                article.author = author

        # Increment view count only for published articles
        if article.status == 'published':
            article.views = (article.views or 0) + 1
            db.session.commit()

        # Get full article data
        article_data = article.to_dict(include_content=True)

        logger.info(f'✅ Article detail loaded successfully: {article_id}')

        return jsonify({
            'success': True,
            'data': article_data
        }), 200

    except Exception as e:
        logger.error(f'❌ Error getting article detail: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to get article: {str(e)}',
            'error_code': 'INTERNAL_ERROR'
        }), 500


# ✅ Update Article
@bp.route('/<int:article_id>', methods=['PUT'])
@jwt_required()
def update_article(article_id):
    """Update article"""
    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity',
                'error_code': 'INVALID_USER_IDENTITY'
            }), 422

        # Get existing article
        article = db.session.query(Article).filter_by(article_id=article_id).first()
        if not article:
            return jsonify({
                'success': False,
                'error': 'Article not found',
                'error_code': 'ARTICLE_NOT_FOUND'
            }), 404

        # Check ownership
        if article.author_id != current_user_id:
            return jsonify({
                'success': False,
                'error': 'You can only edit your own articles',
                'error_code': 'PERMISSION_DENIED'
            }), 403

        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided',
                'error_code': 'NO_DATA'
            }), 400

        # Update fields
        if 'title' in data:
            title = data['title'].strip()
            if not title:
                return jsonify({
                    'success': False,
                    'error': 'Title cannot be empty',
                    'error_code': 'INVALID_TITLE'
                }), 400
            article.title = title

        if 'content' in data:
            content = data['content'].strip()
            if not content:
                return jsonify({
                    'success': False,
                    'error': 'Content cannot be empty',
                    'error_code': 'INVALID_CONTENT'
                }), 400
            article.content = content
            article.content_body = content

            # Recalculate reading time
            word_count = len(content.split())
            article.reading_time = max(1, round(word_count / 225))

        if 'excerpt' in data:
            article.excerpt = data['excerpt'].strip()

        if 'category' in data:
            article.category = data['category'].strip()

        if 'tags' in data:
            article.tags = data['tags'].strip()

        if 'featured_image' in data:
            article.featured_image = data['featured_image'].strip()
            article.featured_image_url = data['featured_image'].strip()

        if 'meta_description' in data:
            article.meta_description = data['meta_description'].strip()

        if 'status' in data:
            old_status = article.status
            new_status = data['status']
            if new_status == 'published' and article.status != 'published':
                article.status = 'published'
                article.article_status = 2
                article.published_at = datetime.utcnow()
                
                # Create notifications for followers when article is published
                try:
                    from app.services.notification_service import NotificationService
                    notification_service = NotificationService()
                    notification_result = notification_service.create_new_article_notifications(
                        article_id=article.article_id,
                        article_title=article.title,
                        doctor_user_id=current_user_id
                    )
                    if notification_result.get('success'):
                        logger.info(f'✅ Created {notification_result.get("notifications_created", 0)} notifications for published article {article.article_id}')
                    else:
                        logger.warning(f'⚠️ Failed to create notifications: {notification_result.get("message", "Unknown error")}')
                except Exception as notification_error:
                    logger.warning(f'⚠️ Notification creation failed: {str(notification_error)}')
                    # Don't fail the entire request, just log the error
                    
            elif new_status == 'draft':
                article.status = 'draft'
                article.article_status = 1
                article.published_at = None
            else:
                article.status = new_status

        if 'featured' in data:
            article.featured = bool(data['featured'])

        # Update timestamp
        article.updated_at = datetime.utcnow()

        db.session.commit()

        # Return updated article
        updated_article = article.to_dict(include_content=True)

        logger.info(f'✅ Article {article_id} updated by user {current_user_id}')

        return jsonify({
            'success': True,
            'data': updated_article,
            'message': 'Article updated successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f'❌ Error updating article: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to update article: {str(e)}',
            'error_code': 'UPDATE_ERROR'
        }), 500


# ✅ Delete Article
@bp.route('/<int:article_id>', methods=['DELETE'])
@jwt_required()
def delete_article(article_id):
    """Delete article (only by author or admin)"""
    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity',
                'error_code': 'INVALID_USER_IDENTITY'
            }), 422

        # Get article
        article = db.session.query(Article).filter_by(article_id=article_id).first()
        if not article:
            return jsonify({
                'success': False,
                'error': 'Article not found',
                'error_code': 'ARTICLE_NOT_FOUND'
            }), 404

        # Check ownership or admin permission
        user = db.session.query(User).filter_by(user_id=current_user_id).first()
        if article.author_id != current_user_id and (not user or user.role_id != 1):
            return jsonify({
                'success': False,
                'error': 'You can only delete your own articles',
                'error_code': 'PERMISSION_DENIED'
            }), 403

        # Delete article from database (relationships will cascade)
        db.session.delete(article)
        db.session.commit()

        logger.info(f'✅ Article {article_id} deleted by user {current_user_id}')

        return jsonify({
            'success': True,
            'message': 'Article deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f'❌ Error deleting article: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to delete article: {str(e)}',
            'error_code': 'DELETE_ERROR'
        }), 500


# ✅ Health check endpoint
@bp.route('/health', methods=['GET'])
def articles_health():
    """Health check for articles service"""
    try:
        # Test database connection
        article_count = db.session.query(Article).count()
        pending_count = db.session.query(Article).filter_by(status='pending').count()

        return jsonify({
            'success': True,
            'service': 'articles',
            'status': 'healthy',
            'database': 'connected',
            'total_articles': article_count,
            'pending_articles': pending_count,
            'endpoints': {
                'list': 'GET /api/articles',
                'create': 'POST /api/articles',
                'detail': 'GET /api/articles/{id}',
                'update': 'PUT /api/articles/{id}',
                'delete': 'DELETE /api/articles/{id}',
                'my_articles': 'GET /api/articles/my-articles',
                'resubmit': 'POST /api/articles/{id}/resubmit',
                'health': 'GET /api/articles/health'
            }
        }), 200
    except Exception as e:
        logger.error(f'Articles health check failed: {str(e)}')
        return jsonify({
            'success': False,
            'service': 'articles',
            'status': 'unhealthy',
            'error': str(e)
        }), 500