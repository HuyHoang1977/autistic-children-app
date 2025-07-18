import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.articles_model import Article
from app.models.users_model import User
from app.models.admins_model import Admin
from app.extensions import db
from datetime import datetime
from sqlalchemy import desc, asc, or_, and_, func, text
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)
bp = Blueprint('admin_articles', __name__)


def get_user_id_from_jwt():
    """Helper function to get user_id from JWT"""
    try:
        current_user_identity = get_jwt_identity()
        if isinstance(current_user_identity, str):
            return int(current_user_identity)
        return current_user_identity
    except (ValueError, TypeError):
        return None


def check_admin_permission(current_user_id):
    """Check if current user is admin"""
    try:
        result = db.session.execute(
            text("SELECT role_id FROM users WHERE user_id = :user_id"),
            {'user_id': current_user_id}
        )
        user_row = result.fetchone()

        if not user_row:
            return False, "User not found"

        if user_row[0] == 1:  # Admin role
            return True, None

        return False, "Admin permission required"
    except Exception as e:
        logger.error(f"Error checking admin permission: {e}")
        return False, f"Permission check failed: {str(e)}"


def cors_preflight_response():
    """Common CORS preflight response"""
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response, 200


# ✅ CORS Options handlers
@bp.route('', methods=['OPTIONS'])
@bp.route('/', methods=['OPTIONS'])
@bp.route('/<int:article_id>', methods=['OPTIONS'])
@bp.route('/<int:article_id>/approve', methods=['OPTIONS'])
@bp.route('/<int:article_id>/reject', methods=['OPTIONS'])
@bp.route('/<int:article_id>/feature', methods=['OPTIONS'])
@bp.route('/stats', methods=['OPTIONS'])
def admin_articles_options(**kwargs):
    """Handle CORS preflight requests"""
    return cors_preflight_response()


# ✅ GET All Articles for Admin
@bp.route('', methods=['GET'])
@bp.route('/', methods=['GET'])
@jwt_required()
def get_admin_articles():
    """Get all articles with admin filters and pagination"""
    logger.info('=== ADMIN GET ARTICLES START ===')

    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity'
            }), 422

        # Check admin permission
        is_admin, error_msg = check_admin_permission(current_user_id)
        if not is_admin:
            return jsonify({
                'success': False,
                'error': error_msg,
                'error_code': 'PERMISSION_DENIED'
            }), 403

        # Get query parameters
        page = request.args.get('page', default=1, type=int)
        limit = request.args.get('limit', default=20, type=int)
        status = request.args.get('status', '').strip()
        category = request.args.get('category', '').strip()
        author = request.args.get('author', '').strip()
        search = request.args.get('search', '').strip()
        sort_by = request.args.get('sort_by', 'created_at').strip()
        sort_order = request.args.get('sort_order', 'desc').strip()

        # Validate parameters
        if limit > 100:
            limit = 100
        if page < 1:
            page = 1

        logger.info(f'Admin articles query: page={page}, limit={limit}, status={status}')

        # Build base query with author info
        query = db.session.query(Article).join(User, Article.author_id == User.user_id)

        # Apply filters
        if status:
            query = query.filter(Article.status == status)

        if category:
            query = query.filter(Article.category == category)

        if author:
            if author == 'doctor':
                query = query.filter(User.role_id == 2)
            elif author == 'parent':
                query = query.filter(User.role_id == 3)
            elif author == 'admin':
                query = query.filter(User.role_id == 1)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Article.title.ilike(search_term),
                    Article.content.ilike(search_term),
                    Article.excerpt.ilike(search_term),
                    User.full_name.ilike(search_term)
                )
            )

        # Apply sorting
        if sort_by == 'title':
            order_col = Article.title.desc() if sort_order == 'desc' else Article.title.asc()
        elif sort_by == 'author':
            order_col = User.full_name.desc() if sort_order == 'desc' else User.full_name.asc()
        elif sort_by == 'status':
            order_col = Article.status.desc() if sort_order == 'desc' else Article.status.asc()
        elif sort_by == 'views':
            order_col = Article.views.desc() if sort_order == 'desc' else Article.views.asc()
        elif sort_by == 'likes':
            order_col = Article.like_count.desc() if sort_order == 'desc' else Article.like_count.asc()
        else:  # default to created_at
            order_col = Article.created_at.desc() if sort_order == 'desc' else Article.created_at.asc()

        query = query.order_by(order_col)

        # Get total count
        total_count = query.count()

        # Apply pagination
        offset = (page - 1) * limit
        articles = query.offset(offset).limit(limit).all()

        # Format response
        articles_data = []
        for article in articles:
            try:
                # Get author info
                author_info = {
                    'id': article.author.user_id,
                    'username': article.author.username,
                    'full_name': article.author.full_name,
                    'avatar_url': article.author.avatar_url,
                    'role_display': get_role_display_name(article.author.role_id)
                }

                article_data = {
                    'article_id': article.article_id,
                    'title': article.title,
                    'content': article.content,
                    'excerpt': article.excerpt,
                    'status': article.status,
                    'featured': article.featured,
                    'author_id': article.author_id,
                    'author': author_info,
                    'category': article.category,
                    'tags': article.tags,
                    'created_at': article.created_at.isoformat() if article.created_at else None,
                    'updated_at': article.updated_at.isoformat() if article.updated_at else None,
                    'published_at': article.published_at.isoformat() if article.published_at else None,
                    'like_count': article.like_count or 0,
                    'views': article.views or 0,
                    'comment_count': article.comment_count or 0,
                    'reading_time': article.reading_time or 0,
                    'featured_image': article.featured_image_url or article.featured_image,
                    'rejection_reason': getattr(article, 'rejection_reason', None),
                    'admin_notes': getattr(article, 'admin_notes', None)
                }

                articles_data.append(article_data)

            except Exception as e:
                logger.error(f'Error serializing article {article.article_id}: {e}')
                continue

        # Calculate pagination info
        total_pages = (total_count + limit - 1) // limit
        has_more = offset + limit < total_count

        response_data = {
            'success': True,
            'data': articles_data,
            'pagination': {
                'current_page': page,
                'per_page': limit,
                'total': total_count,
                'total_pages': total_pages,
                'has_more': has_more
            }
        }

        logger.info(f'Admin retrieved {len(articles_data)} articles (page {page}/{total_pages})')
        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f'Error in admin get articles: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to get articles: {str(e)}'
        }), 500


@bp.route('/<int:article_id>', methods=['GET'])
@jwt_required()
def get_admin_article_detail(article_id):
    """Get detailed article information for admin review - FIXED JOIN ISSUE"""
    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity'
            }), 422

        # Check admin permission
        is_admin, error_msg = check_admin_permission(current_user_id)
        if not is_admin:
            return jsonify({
                'success': False,
                'error': error_msg
            }), 403

        # ✅ FIX: Get article without problematic join
        article = Article.query.get_or_404(article_id)

        # ✅ FIX: Get author separately to avoid join issues
        author = User.query.get(article.author_id)

        # Format detailed response
        article_data = {
            'article_id': article.article_id,
            'title': article.title,
            'content': article.content,
            'excerpt': article.excerpt,
            'status': article.status,
            'featured': article.featured,
            'author_id': article.author_id,
            'author': {
                'id': author.user_id,
                'username': author.username,
                'full_name': author.full_name,
                'avatar_url': author.avatar_url,
                'role_display': get_role_display_name(author.role_id)
            } if author else None,
            'category': article.category,
            'tags': article.tags,
            'created_at': article.created_at.isoformat() if article.created_at else None,
            'updated_at': article.updated_at.isoformat() if article.updated_at else None,
            'published_at': article.published_at.isoformat() if article.published_at else None,
            'like_count': article.like_count or 0,
            'views': article.views or 0,
            'comment_count': article.comment_count or 0,
            'reading_time': article.reading_time or 0,
            'featured_image': article.featured_image_url or article.featured_image,
            'rejection_reason': getattr(article, 'rejection_reason', None),
            'admin_notes': getattr(article, 'admin_notes', None)
        }

        return jsonify({
            'success': True,
            'data': article_data
        }), 200

    except Exception as e:
        logger.error(f'Error getting article detail: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to get article: {str(e)}'
        }), 500


# ✅ APPROVE Article
@bp.route('/<int:article_id>/approve', methods=['POST'])
@jwt_required()
def approve_article(article_id):
    """Approve article for publication"""
    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity'
            }), 422

        # Check admin permission
        is_admin, error_msg = check_admin_permission(current_user_id)
        if not is_admin:
            return jsonify({
                'success': False,
                'error': error_msg
            }), 403

        # Get article
        article = db.session.query(Article).filter_by(article_id=article_id).first()
        if not article:
            return jsonify({
                'success': False,
                'error': 'Article not found'
            }), 404

        # Update article status
        article.status = 'published'
        article.article_status = 2
        article.published_at = datetime.utcnow()
        article.updated_at = datetime.utcnow()

        # Clear rejection reason if exists
        if hasattr(article, 'rejection_reason'):
            article.rejection_reason = None
        if hasattr(article, 'admin_notes'):
            article.admin_notes = None

        db.session.commit()

        logger.info(f'Article {article_id} approved by admin {current_user_id}')

        return jsonify({
            'success': True,
            'message': 'Article approved successfully',
            'data': {
                'article_id': article_id,
                'status': 'published',
                'published_at': article.published_at.isoformat()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f'Error approving article: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to approve article: {str(e)}'
        }), 500


# ✅ REJECT Article
@bp.route('/<int:article_id>/reject', methods=['POST'])
@jwt_required()
def reject_article(article_id):
    """Reject article with reason"""
    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity'
            }), 422

        # Check admin permission
        is_admin, error_msg = check_admin_permission(current_user_id)
        if not is_admin:
            return jsonify({
                'success': False,
                'error': error_msg
            }), 403

        # Get rejection reason from request
        data = request.get_json()
        rejection_reason = data.get('reason', '').strip() if data else ''
        admin_notes = data.get('notes', '').strip() if data else ''

        if not rejection_reason:
            return jsonify({
                'success': False,
                'error': 'Rejection reason is required'
            }), 400

        # Get article
        article = db.session.query(Article).filter_by(article_id=article_id).first()
        if not article:
            return jsonify({
                'success': False,
                'error': 'Article not found'
            }), 404

        # Update article status
        article.status = 'rejected'
        article.article_status = 0
        article.updated_at = datetime.utcnow()

        # Add rejection fields (you might need to add these to your Article model)
        # For now, we'll store in a separate table or use JSON field
        # This is a simplified approach - in production, create a separate table
        try:
            # Try to set rejection reason if field exists
            if hasattr(article, 'rejection_reason'):
                article.rejection_reason = rejection_reason
            if hasattr(article, 'admin_notes'):
                article.admin_notes = admin_notes
        except AttributeError:
            # If fields don't exist, log for now
            logger.warning(f'Article model missing rejection fields for article {article_id}')

        db.session.commit()

        logger.info(f'Article {article_id} rejected by admin {current_user_id}')

        return jsonify({
            'success': True,
            'message': 'Article rejected successfully',
            'data': {
                'article_id': article_id,
                'status': 'rejected',
                'rejection_reason': rejection_reason,
                'admin_notes': admin_notes
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f'Error rejecting article: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to reject article: {str(e)}'
        }), 500


# ✅ TOGGLE Feature Status
@bp.route('/<int:article_id>/feature', methods=['POST'])
@jwt_required()
def toggle_feature_article(article_id):
    """Toggle article featured status"""
    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity'
            }), 422

        # Check admin permission
        is_admin, error_msg = check_admin_permission(current_user_id)
        if not is_admin:
            return jsonify({
                'success': False,
                'error': error_msg
            }), 403

        # Get article
        article = db.session.query(Article).filter_by(article_id=article_id).first()
        if not article:
            return jsonify({
                'success': False,
                'error': 'Article not found'
            }), 404

        # Only published articles can be featured
        if article.status != 'published':
            return jsonify({
                'success': False,
                'error': 'Only published articles can be featured'
            }), 400

        # Toggle featured status
        article.featured = not article.featured
        article.updated_at = datetime.utcnow()

        db.session.commit()

        action = 'featured' if article.featured else 'unfeatured'
        logger.info(f'Article {article_id} {action} by admin {current_user_id}')

        return jsonify({
            'success': True,
            'message': f'Article {action} successfully',
            'data': {
                'article_id': article_id,
                'featured': article.featured
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f'Error toggling feature status: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to update feature status: {str(e)}'
        }), 500


# ✅ BATCH Operations
@bp.route('/batch-action', methods=['POST'])
@jwt_required()
def batch_article_action():
    """Batch operations on multiple articles"""
    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity'
            }), 422

        # Check admin permission
        is_admin, error_msg = check_admin_permission(current_user_id)
        if not is_admin:
            return jsonify({
                'success': False,
                'error': error_msg
            }), 403

        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        article_ids = data.get('article_ids', [])
        action = data.get('action', '').strip()
        reason = data.get('reason', '').strip()

        if not article_ids or not action:
            return jsonify({
                'success': False,
                'error': 'article_ids and action are required'
            }), 400

        if action == 'reject' and not reason:
            return jsonify({
                'success': False,
                'error': 'Rejection reason is required'
            }), 400

        results = {
            'success': 0,
            'failed': 0,
            'errors': []
        }

        for article_id in article_ids:
            try:
                article = db.session.query(Article).filter_by(article_id=article_id).first()
                if not article:
                    results['failed'] += 1
                    results['errors'].append(f'Article {article_id} not found')
                    continue

                if action == 'approve':
                    article.status = 'published'
                    article.article_status = 2
                    article.published_at = datetime.utcnow()
                    if hasattr(article, 'rejection_reason'):
                        article.rejection_reason = None
                elif action == 'reject':
                    article.status = 'rejected'
                    article.article_status = 0
                    if hasattr(article, 'rejection_reason'):
                        article.rejection_reason = reason
                elif action == 'feature':
                    if article.status == 'published':
                        article.featured = True
                    else:
                        results['failed'] += 1
                        results['errors'].append(f'Article {article_id} must be published to feature')
                        continue
                elif action == 'unfeature':
                    article.featured = False
                else:
                    results['failed'] += 1
                    results['errors'].append(f'Unknown action: {action}')
                    continue

                article.updated_at = datetime.utcnow()
                results['success'] += 1

            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f'Article {article_id}: {str(e)}')

        db.session.commit()

        logger.info(
            f'Batch {action} by admin {current_user_id}: {results["success"]} success, {results["failed"]} failed')

        return jsonify({
            'success': True,
            'message': f'Batch {action} completed: {results["success"]} success, {results["failed"]} failed',
            'data': results
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f'Error in batch operation: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Batch operation failed: {str(e)}'
        }), 500


# ✅ GET Admin Articles Statistics
@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_admin_articles_stats():
    """Get articles statistics for admin dashboard"""
    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity'
            }), 422

        # Check admin permission
        is_admin, error_msg = check_admin_permission(current_user_id)
        if not is_admin:
            return jsonify({
                'success': False,
                'error': error_msg
            }), 403

        # Get basic stats
        total_articles = db.session.query(Article).count()
        pending_articles = db.session.query(Article).filter_by(status='pending').count()
        published_articles = db.session.query(Article).filter_by(status='published').count()
        rejected_articles = db.session.query(Article).filter_by(status='rejected').count()
        featured_articles = db.session.query(Article).filter_by(featured=True).count()

        # Get stats by author role
        articles_by_doctors = db.session.query(Article).join(User).filter(
            User.role_id == 2
        ).count()
        articles_by_parents = db.session.query(Article).join(User).filter(
            User.role_id == 3
        ).count()

        # Get recent activity (last 7 days)
        from datetime import timedelta
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_articles = db.session.query(Article).filter(
            Article.created_at >= seven_days_ago
        ).count()
        recent_pending = db.session.query(Article).filter(
            Article.created_at >= seven_days_ago,
            Article.status == 'pending'
        ).count()

        # Get top categories
        category_stats = db.session.query(
            Article.category,
            func.count(Article.article_id).label('count')
        ).filter(
            Article.category.isnot(None),
            Article.category != ''
        ).group_by(Article.category).order_by(
            func.count(Article.article_id).desc()
        ).limit(5).all()

        stats = {
            'total_articles': total_articles,
            'pending_articles': pending_articles,
            'published_articles': published_articles,
            'rejected_articles': rejected_articles,
            'featured_articles': featured_articles,
            'articles_by_role': {
                'doctors': articles_by_doctors,
                'parents': articles_by_parents
            },
            'recent_activity': {
                'total_last_7_days': recent_articles,
                'pending_last_7_days': recent_pending
            },
            'top_categories': [
                {'category': cat[0], 'count': cat[1]} for cat in category_stats
            ]
        }

        return jsonify({
            'success': True,
            'data': stats,
            'generated_at': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        logger.error(f'Error getting articles stats: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to get statistics: {str(e)}'
        }), 500


# ✅ UPDATE Article Status (Generic)
@bp.route('/<int:article_id>/status', methods=['PUT'])
@jwt_required()
def update_article_status(article_id):
    """Update article status (generic endpoint)"""
    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity'
            }), 422

        # Check admin permission
        is_admin, error_msg = check_admin_permission(current_user_id)
        if not is_admin:
            return jsonify({
                'success': False,
                'error': error_msg
            }), 403

        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        new_status = data.get('status', '').strip()
        reason = data.get('reason', '').strip()

        if not new_status:
            return jsonify({
                'success': False,
                'error': 'Status is required'
            }), 400

        if new_status not in ['draft', 'pending', 'published', 'rejected']:
            return jsonify({
                'success': False,
                'error': 'Invalid status'
            }), 400

        # Get article
        article = db.session.query(Article).filter_by(article_id=article_id).first()
        if not article:
            return jsonify({
                'success': False,
                'error': 'Article not found'
            }), 404

        # Update status
        old_status = article.status
        article.status = new_status
        article.updated_at = datetime.utcnow()

        # Handle specific status changes
        if new_status == 'published':
            article.article_status = 2
            if not article.published_at:
                article.published_at = datetime.utcnow()
        elif new_status == 'rejected':
            article.article_status = 0
            if hasattr(article, 'rejection_reason') and reason:
                article.rejection_reason = reason
        else:
            article.article_status = 1

        db.session.commit()

        logger.info(f'Article {article_id} status changed from {old_status} to {new_status} by admin {current_user_id}')

        return jsonify({
            'success': True,
            'message': f'Article status updated to {new_status}',
            'data': {
                'article_id': article_id,
                'old_status': old_status,
                'new_status': new_status
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f'Error updating article status: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to update status: {str(e)}'
        }), 500


# ✅ Helper functions
def get_role_display_name(role_id):
    """Get user-friendly role name"""
    role_names = {
        1: 'Admin',
        2: 'Doctor',
        3: 'Parent'
    }
    return role_names.get(role_id, 'Unknown')


# ✅ Health check
@bp.route('/health', methods=['GET'])
def admin_articles_health():
    """Health check for admin articles service"""
    try:
        # Test database connection
        total_articles = db.session.query(Article).count()
        pending_articles = db.session.query(Article).filter_by(status='pending').count()

        return jsonify({
            'success': True,
            'service': 'admin_articles',
            'status': 'healthy',
            'database': 'connected',
            'total_articles': total_articles,
            'pending_articles': pending_articles,
            'endpoints': {
                'list': 'GET /api/admin/articles',
                'detail': 'GET /api/admin/articles/{id}',
                'approve': 'POST /api/admin/articles/{id}/approve',
                'reject': 'POST /api/admin/articles/{id}/reject',
                'feature': 'POST /api/admin/articles/{id}/feature',
                'batch_action': 'POST /api/admin/articles/batch-action',
                'stats': 'GET /api/admin/articles/stats',
                'update_status': 'PUT /api/admin/articles/{id}/status'
            }
        }), 200
    except Exception as e:
        logger.error(f'Admin articles health check failed: {str(e)}')
        return jsonify({
            'success': False,
            'service': 'admin_articles',
            'status': 'unhealthy',
            'error': str(e)
        }), 500