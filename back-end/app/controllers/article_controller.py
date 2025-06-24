from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, jwt_required
from app.models.articles_model import Article
from app.models.users_model import User
from app.models.contents_model import Content
from app.models.favorites_model import Favorite
from app.models.saved_articles_model import SavedArticle
from app.extensions import db
from sqlalchemy import desc, or_, and_
import logging

logger = logging.getLogger(__name__)

article_bp = Blueprint('articles', __name__, url_prefix='/articles')


@article_bp.route('', methods=['GET'])
def get_articles():
    """
    Get articles with filters and pagination
    """
    try:
        # Get query parameters
        limit = request.args.get('limit', type=int, default=10)
        page = request.args.get('page', type=int, default=1)
        category_id = request.args.get('category_id', type=int)
        author_id = request.args.get('author_id', type=int)
        is_published = request.args.get('is_published', type=bool)
        search = request.args.get('search', '').strip()
        sort_by = request.args.get('sort_by', 'published_at')
        sort_order = request.args.get('sort_order', 'desc')
        featured = request.args.get('featured', type=bool)
        status = request.args.get('status', 'published')

        # Build query
        query = db.session.query(Article).join(User, Article.author_id == User.user_id)

        # Apply filters
        if status == 'published':
            query = query.filter(Article.status == 'published')
        elif status:
            query = query.filter(Article.status == status)

        if category_id:
            query = query.filter(Article.category == str(category_id))

        if author_id:
            query = query.filter(Article.author_id == author_id)

        if featured is not None:
            query = query.filter(Article.featured == featured)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Article.title.ilike(search_term),
                    Article.content.ilike(search_term),
                    Article.excerpt.ilike(search_term)
                )
            )

        # Apply sorting
        if sort_by == 'published_at':
            order_col = Article.published_at
        elif sort_by == 'created_at':
            order_col = Article.created_at
        elif sort_by == 'likes':
            order_col = Article.like_count
        elif sort_by == 'views':
            order_col = Article.views
        else:
            order_col = Article.published_at

        if sort_order == 'desc':
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(order_col)

        # Pagination
        offset = (page - 1) * limit
        total = query.count()
        articles = query.offset(offset).limit(limit).all()

        # Format response
        result = []
        for article in articles:
            article_data = article.to_dict(include_content=False)  # Exclude full content for list
            result.append(article_data)

        return jsonify({
            'success': True,
            'data': result,
            'pagination': {
                'current_page': page,
                'per_page': limit,
                'total': total,
                'total_pages': (total + limit - 1) // limit,
                'has_more': offset + limit < total
            }
        })

    except Exception as e:
        logger.error(f'Error getting articles: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to get articles'
        }), 500


@article_bp.route('/<int:article_id>', methods=['GET'])
def get_article_detail(article_id):
    """
    Get article detail with full content
    """
    try:
        # Get article with author info
        article = db.session.query(Article).join(User, Article.author_id == User.user_id).filter(
            Article.article_id == article_id
        ).first()

        if not article:
            return jsonify({
                'success': False,
                'error': 'Article not found'
            }), 404

        # Increment view count
        article.views = (article.views or 0) + 1
        db.session.commit()

        # Get full article data
        article_data = article.to_dict(include_content=True)

        return jsonify({
            'success': True,
            'data': article_data
        })

    except Exception as e:
        logger.error(f'Error getting article detail: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to get article'
        }), 500


@article_bp.route('', methods=['POST'])
@jwt_required()
def create_article():
    """
    Create new article
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Extract data
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        excerpt = data.get('excerpt', '').strip()
        category = data.get('category', '').strip()
        tags = data.get('tags', '').strip()
        featured_image_url = data.get('featured_image_url', '').strip()
        status = data.get('status', 'draft')

        # Validation
        if not title:
            return jsonify({
                'success': False,
                'error': 'Title is required'
            }), 400

        if not content:
            return jsonify({
                'success': False,
                'error': 'Content is required'
            }), 400

        if len(title) > 255:
            return jsonify({
                'success': False,
                'error': 'Title too long (max 255 characters)'
            }), 400

        # Create article
        article = Article(
            title=title,
            content=content,
            excerpt=excerpt,
            category=category,
            tags=tags,
            featured_image_url=featured_image_url,
            author_id=user_id,
            status=status
        )

        # Set published_at if publishing
        if status == 'published':
            article.publish()

        db.session.add(article)
        db.session.commit()

        # Get created article with author info
        created_article = db.session.query(Article).join(User).filter(
            Article.article_id == article.article_id
        ).first()

        logger.info(f'Article created by user {user_id}: {article.article_id}')

        return jsonify({
            'success': True,
            'data': created_article.to_dict(),
            'message': 'Article created successfully'
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f'Error creating article: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to create article'
        }), 500


@article_bp.route('/<int:article_id>', methods=['PUT'])
@jwt_required()
def update_article(article_id):
    """
    Update article (only by author)
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Get article
        article = db.session.query(Article).filter_by(article_id=article_id).first()
        if not article:
            return jsonify({
                'success': False,
                'error': 'Article not found'
            }), 404

        # Check ownership
        if article.author_id != user_id:
            return jsonify({
                'success': False,
                'error': 'You can only edit your own articles'
            }), 403

        # Update fields
        if 'title' in data:
            title = data['title'].strip()
            if not title:
                return jsonify({
                    'success': False,
                    'error': 'Title cannot be empty'
                }), 400
            article.title = title

        if 'content' in data:
            content = data['content'].strip()
            if not content:
                return jsonify({
                    'success': False,
                    'error': 'Content cannot be empty'
                }), 400
            article.content = content

        if 'excerpt' in data:
            article.excerpt = data['excerpt'].strip()

        if 'category' in data:
            article.category = data['category'].strip()

        if 'tags' in data:
            article.tags = data['tags'].strip()

        if 'featured_image_url' in data:
            article.featured_image_url = data['featured_image_url'].strip()

        if 'status' in data:
            new_status = data['status']
            if new_status == 'published' and article.status != 'published':
                article.publish()
            elif new_status == 'draft' and article.status == 'published':
                article.unpublish()
            else:
                article.status = new_status

        db.session.commit()

        logger.info(f'Article {article_id} updated by user {user_id}')

        return jsonify({
            'success': True,
            'data': article.to_dict(),
            'message': 'Article updated successfully'
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f'Error updating article: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to update article'
        }), 500


@article_bp.route('/<int:article_id>', methods=['DELETE'])
@jwt_required()
def delete_article(article_id):
    """
    Delete article (only by author)
    """
    try:
        user_id = get_jwt_identity()

        # Get article
        article = db.session.query(Article).filter_by(article_id=article_id).first()
        if not article:
            return jsonify({
                'success': False,
                'error': 'Article not found'
            }), 404

        # Check ownership
        if article.author_id != user_id:
            return jsonify({
                'success': False,
                'error': 'You can only delete your own articles'
            }), 403

        # Delete article (cascade will handle related records)
        db.session.delete(article)
        db.session.commit()

        logger.info(f'Article {article_id} deleted by user {user_id}')

        return jsonify({
            'success': True,
            'message': 'Article deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f'Error deleting article: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to delete article'
        }), 500


@article_bp.route('/<int:content_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(content_id):
    """
    Toggle like on article
    """
    try:
        user_id = get_jwt_identity()

        # Find article by content_id or article_id
        article = db.session.query(Article).filter(
            or_(Article.content_id == content_id, Article.article_id == content_id)
        ).first()

        if not article:
            return jsonify({
                'success': False,
                'error': 'Article not found'
            }), 404

        # Check if user already liked this article
        existing_like = db.session.query(Favorite).filter_by(
            user_id=user_id,
            content_id=article.content_id or article.article_id,
            like_type=1  # article like
        ).first()

        if existing_like:
            # Unlike: remove like and decrement count
            db.session.delete(existing_like)
            article.update_engagement(likes_delta=-1)
            liked = False
        else:
            # Like: add like and increment count
            new_like = Favorite(
                user_id=user_id,
                content_id=article.content_id or article.article_id,
                like_type=1
            )
            db.session.add(new_like)
            article.update_engagement(likes_delta=1)
            liked = True

        db.session.commit()

        logger.info(f'Article {article.article_id} like toggled by user {user_id}: {liked}')

        return jsonify({
            'success': True,
            'data': {
                'liked': liked,
                'like_count': article.like_count
            }
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f'Error toggling like: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to toggle like'
        }), 500


@article_bp.route('/<int:article_id>/save', methods=['POST'])
@jwt_required()
def toggle_save(article_id):
    """
    Toggle save article
    """
    try:
        user_id = get_jwt_identity()

        # Get article
        article = db.session.query(Article).filter_by(article_id=article_id).first()
        if not article:
            return jsonify({
                'success': False,
                'error': 'Article not found'
            }), 404

        # Get user's parent profile (assuming only parents can save articles)
        from app.models.parents_model import Parent
        parent = db.session.query(Parent).filter_by(user_id=user_id).first()
        if not parent:
            return jsonify({
                'success': False,
                'error': 'Only parents can save articles'
            }), 403

        # Check if already saved
        existing_save = db.session.query(SavedArticle).filter_by(
            parent_id=parent.parent_id,
            article_id=article_id
        ).first()

        if existing_save:
            # Unsave
            db.session.delete(existing_save)
            saved = False
        else:
            # Save
            new_save = SavedArticle(
                parent_id=parent.parent_id,
                article_id=article_id,
                notes=request.get_json().get('notes', '') if request.get_json() else ''
            )
            db.session.add(new_save)
            saved = True

        db.session.commit()

        logger.info(f'Article {article_id} save toggled by user {user_id}: {saved}')

        return jsonify({
            'success': True,
            'data': {
                'saved': saved
            }
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f'Error toggling save: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to toggle save'
        }), 500


@article_bp.route('/<int:article_id>/share', methods=['POST'])
@jwt_required()
def share_article(article_id):
    """
    Record article share (increment share count)
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}

        # Get article
        article = db.session.query(Article).filter_by(article_id=article_id).first()
        if not article:
            return jsonify({
                'success': False,
                'error': 'Article not found'
            }), 404

        # Increment share count
        article.update_engagement(shares_delta=1)
        db.session.commit()

        # Log share details
        platform = data.get('platform', 'unknown')
        logger.info(f'Article {article_id} shared by user {user_id} on {platform}')

        return jsonify({
            'success': True,
            'data': {
                'share_count': article.share_count
            },
            'message': 'Share recorded successfully'
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f'Error recording share: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to record share'
        }), 500


@article_bp.route('/my-articles', methods=['GET'])
@jwt_required()
def get_my_articles():
    """
    Get current user's articles
    """
    try:
        user_id = get_jwt_identity()

        # Get query parameters
        limit = request.args.get('limit', type=int, default=10)
        page = request.args.get('page', type=int, default=1)
        status = request.args.get('status')  # filter by status

        # Build query
        query = db.session.query(Article).filter_by(author_id=user_id)

        if status:
            query = query.filter_by(status=status)

        query = query.order_by(desc(Article.created_at))

        # Pagination
        offset = (page - 1) * limit
        total = query.count()
        articles = query.offset(offset).limit(limit).all()

        # Format response
        result = [article.to_dict(include_content=False) for article in articles]

        return jsonify({
            'success': True,
            'data': result,
            'pagination': {
                'current_page': page,
                'per_page': limit,
                'total': total,
                'total_pages': (total + limit - 1) // limit
            }
        })

    except Exception as e:
        logger.error(f'Error getting user articles: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to get user articles'
        }), 500


@article_bp.route('/saved', methods=['GET'])
@jwt_required()
def get_saved_articles():
    """
    Get user's saved articles
    """
    try:
        user_id = get_jwt_identity()

        # Get user's parent profile
        from app.models.parents_model import Parent
        parent = db.session.query(Parent).filter_by(user_id=user_id).first()
        if not parent:
            return jsonify({
                'success': False,
                'error': 'Only parents can have saved articles'
            }), 403

        # Get saved articles
        saved_articles = db.session.query(SavedArticle, Article, User).join(
            Article, SavedArticle.article_id == Article.article_id
        ).join(
            User, Article.author_id == User.user_id
        ).filter(
            SavedArticle.parent_id == parent.parent_id
        ).order_by(desc(SavedArticle.saved_at)).all()

        # Format response
        result = []
        for saved_article, article, author in saved_articles:
            article_data = article.to_dict(include_content=False)
            article_data['saved_at'] = saved_article.saved_at.isoformat()
            article_data['saved_notes'] = saved_article.notes
            result.append(article_data)

        return jsonify({
            'success': True,
            'data': result
        })

    except Exception as e:
        logger.error(f'Error getting saved articles: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to get saved articles'
        }), 500


@article_bp.route('/featured', methods=['GET'])
def get_featured_articles():
    """
    Get featured articles
    """
    try:
        limit = request.args.get('limit', type=int, default=6)

        articles = db.session.query(Article).join(User).filter(
            Article.featured == True,
            Article.status == 'published'
        ).order_by(desc(Article.published_at)).limit(limit).all()

        result = [article.to_dict(include_content=False) for article in articles]

        return jsonify({
            'success': True,
            'data': result
        })

    except Exception as e:
        logger.error(f'Error getting featured articles: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to get featured articles'
        }), 500


@article_bp.route('/trending', methods=['GET'])
def get_trending_articles():
    """
    Get trending articles (based on views and likes)
    """
    try:
        limit = request.args.get('limit', type=int, default=10)

        # Simple trending algorithm: sort by likes + views in last 7 days
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)

        articles = db.session.query(Article).join(User).filter(
            Article.status == 'published',
            Article.published_at >= week_ago
        ).order_by(
            desc(Article.like_count + Article.views)
        ).limit(limit).all()

        result = [article.to_dict(include_content=False) for article in articles]

        return jsonify({
            'success': True,
            'data': result
        })

    except Exception as e:
        logger.error(f'Error getting trending articles: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to get trending articles'
        }), 500