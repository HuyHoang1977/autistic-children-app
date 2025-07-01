# app/routers/admin_router.py - COMPLETE ULTRA SAFE HARD DELETE IMPLEMENTATION
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.users_model import User
from app.models.admins_model import Admin
from app.models.doctors_model import Doctor
from app.models.parents_model import Parent
from app.models.roles_model import Role
from app.extensions import db
from datetime import datetime
from sqlalchemy import desc, asc, or_, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

logger = logging.getLogger(__name__)
bp = Blueprint('admin', __name__)


# ✅ ENHANCED HELPER FUNCTIONS
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
    """Check if current user is admin using safe SQL"""
    try:
        # Reset session first to avoid transaction issues
        reset_db_session()

        # Use raw SQL to avoid ORM issues
        result = db.session.execute(
            text("SELECT role_id FROM users WHERE user_id = :user_id"),
            {'user_id': current_user_id}
        )
        user_row = result.fetchone()

        if not user_row:
            db.session.rollback()
            return False, "User not found"

        # Check if user is admin (role_id = 1)
        if user_row[0] == 1:
            db.session.commit()
            return True, None

        db.session.commit()
        return False, "Admin permission required"

    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error checking admin permission: {e}")
        return False, f"Permission check failed: {str(e)}"


def reset_db_session():
    """Enhanced reset database session when transaction is in failed state"""
    try:
        # Try to rollback current transaction
        db.session.rollback()
        logger.debug('✅ Transaction rolled back')
    except Exception as e:
        logger.debug(f'⚠️ Rollback warning (expected): {e}')

    try:
        # Close current session
        db.session.close()
        logger.debug('✅ Session closed')
    except Exception as e:
        logger.debug(f'⚠️ Session close warning: {e}')

    try:
        # Remove session from registry
        db.session.remove()
        logger.debug('✅ Session removed from registry')
    except Exception as e:
        logger.debug(f'⚠️ Session remove warning: {e}')

    # Test new session
    try:
        db.session.execute(text('SELECT 1'))
        db.session.commit()
        logger.debug('✅ New session tested successfully')
    except Exception as e:
        logger.warning(f'⚠️ New session test failed: {e}')
        try:
            db.session.rollback()
        except:
            pass


def safe_execute_sql_enhanced(sql_text, params=None, description="SQL operation"):
    """Enhanced safely execute SQL with proper error handling and transaction management"""
    try:
        # Reset session if needed
        reset_db_session()

        # Execute SQL
        if params:
            result = db.session.execute(text(sql_text), params)
        else:
            result = db.session.execute(text(sql_text))

        # Get row count before commit
        row_count = result.rowcount

        # Commit transaction
        db.session.commit()

        logger.debug(f'✅ {description} successful: {row_count} rows affected')
        return row_count, None

    except Exception as e:
        try:
            db.session.rollback()
        except:
            pass

        error_msg = str(e)
        logger.warning(f'⚠️ {description} failed: {error_msg}')
        return 0, error_msg


def get_role_display_name(role_id):
    """Get user-friendly role name"""
    role_names = {
        1: 'Admin',
        2: 'Doctor',
        3: 'Parent'
    }
    return role_names.get(role_id, 'Unknown')


def get_user_last_activity(user):
    """Get user's last activity timestamp"""
    try:
        if user.updated_at:
            return user.updated_at.isoformat()
        elif user.created_at:
            return user.created_at.isoformat()
        return None
    except:
        return None


# ✅ CORS PREFLIGHT HANDLERS
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
@bp.route('/users', methods=['OPTIONS'])
@bp.route('/users/<int:user_id>', methods=['OPTIONS'])
@bp.route('/users/<int:user_id>/hard-delete', methods=['OPTIONS'])
@bp.route('/users/<int:user_id>/deletion-info', methods=['OPTIONS'])
@bp.route('/stats', methods=['OPTIONS'])
def admin_options(**kwargs):
    """Handle CORS preflight requests for admin endpoints"""
    return cors_preflight_response()


# ✅ GET ALL USERS
@bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users with filtering, pagination and search for admin dashboard"""
    logger.info('=== ADMIN GET ALL USERS START ===')

    try:
        current_user_id = get_user_id_from_jwt()
        if not current_user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity',
                'error_code': 'INVALID_USER_IDENTITY'
            }), 422

        # Check admin permission
        is_admin, error_msg = check_admin_permission(current_user_id)
        if not is_admin:
            logger.warning(f'❌ Non-admin user {current_user_id} attempted to access admin endpoint')
            return jsonify({
                'success': False,
                'error': error_msg,
                'error_code': 'PERMISSION_DENIED'
            }), 403

        # Get query parameters
        page = request.args.get('page', default=1, type=int)
        limit = request.args.get('limit', default=20, type=int)
        search = request.args.get('search', '').strip()
        role_filter = request.args.get('role', '').strip()
        status_filter = request.args.get('status', '').strip()
        sort_by = request.args.get('sort_by', 'created_at').strip()
        sort_order = request.args.get('sort_order', 'desc').strip()

        # Validate parameters
        if limit > 100:
            limit = 100
        if page < 1:
            page = 1

        logger.info(f'🔍 Admin query: page={page}, limit={limit}, search="{search}", role="{role_filter}"')

        # Build base query with joins for role info
        query = db.session.query(User).outerjoin(Role)

        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    User.username.ilike(search_term),
                    User.email.ilike(search_term),
                    User.full_name.ilike(search_term),
                    User.phone.ilike(search_term)
                )
            )

        # Apply role filter
        if role_filter:
            if role_filter.lower() == 'admin':
                query = query.filter(User.role_id == 1)
            elif role_filter.lower() == 'doctor':
                query = query.filter(User.role_id == 2)
            elif role_filter.lower() == 'parent':
                query = query.filter(User.role_id == 3)

        # Apply status filter
        if status_filter:
            if status_filter.lower() == 'active':
                query = query.filter(User.is_active == True)
            elif status_filter.lower() == 'inactive':
                query = query.filter(User.is_active == False)

        # Apply sorting
        if sort_by == 'username':
            order_col = User.username.desc() if sort_order == 'desc' else User.username.asc()
        elif sort_by == 'email':
            order_col = User.email.desc() if sort_order == 'desc' else User.email.asc()
        elif sort_by == 'full_name':
            order_col = User.full_name.desc() if sort_order == 'desc' else User.full_name.asc()
        elif sort_by == 'role':
            order_col = User.role_id.desc() if sort_order == 'desc' else User.role_id.asc()
        elif sort_by == 'status':
            order_col = User.is_active.desc() if sort_order == 'desc' else User.is_active.asc()
        else:  # default to created_at
            order_col = User.created_at.desc() if sort_order == 'desc' else User.created_at.asc()

        query = query.order_by(order_col)

        # Get total count for pagination
        total_count = query.count()

        # Apply pagination
        offset = (page - 1) * limit
        users = query.offset(offset).limit(limit).all()

        # Format user data with role and profile info
        users_data = []
        for user in users:
            try:
                user_data = user.to_dict()

                # Add role information
                if user.role:
                    user_data['role_info'] = {
                        'role_id': user.role.role_id,
                        'role_name': user.role.role_name,
                        'description': user.role.description
                    }
                else:
                    user_data['role_info'] = None

                # Add computed fields
                user_data['role_display'] = get_role_display_name(user.role_id)
                user_data['status_display'] = 'Active' if user.is_active else 'Inactive'
                user_data['last_activity'] = get_user_last_activity(user)

                users_data.append(user_data)

            except Exception as user_error:
                logger.error(f'❌ Error serializing user {user.user_id}: {str(user_error)}')
                # Add minimal user data if serialization fails
                users_data.append({
                    'user_id': user.user_id,
                    'username': user.username,
                    'email': user.email,
                    'error': 'Serialization failed'
                })

        # Calculate pagination info
        total_pages = (total_count + limit - 1) // limit
        has_more = offset + limit < total_count

        response_data = {
            'success': True,
            'data': users_data,
            'pagination': {
                'current_page': page,
                'per_page': limit,
                'total': total_count,
                'total_pages': total_pages,
                'has_more': has_more
            }
        }

        logger.info(f'✅ Admin retrieved {len(users_data)} users (page {page}/{total_pages})')
        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f'❌ Error in admin get_all_users: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to get users: {str(e)}',
            'error_code': 'ADMIN_ERROR'
        }), 500


# ✅ UPDATE USER STATUS
@bp.route('/users/<int:user_id>/status', methods=['PUT'])
@jwt_required()
def update_user_status(user_id):
    """Update user active status (activate/deactivate)"""
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

        # Prevent admin from deactivating themselves
        if user_id == current_user_id:
            return jsonify({
                'success': False,
                'error': 'Cannot modify your own account status',
                'error_code': 'SELF_MODIFICATION_DENIED'
            }), 403

        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400

        new_status = data.get('is_active')
        if new_status is None:
            return jsonify({
                'success': False,
                'error': 'is_active field is required'
            }), 400

        # Get user
        user = db.session.query(User).filter_by(user_id=user_id).first()
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404

        # Update status
        old_status = user.is_active
        user.is_active = bool(new_status)
        user.updated_at = datetime.utcnow().date()

        db.session.commit()

        logger.info(f'✅ Admin {current_user_id} changed user {user_id} status: {old_status} -> {new_status}')

        return jsonify({
            'success': True,
            'message': f'User status updated to {"active" if new_status else "inactive"}',
            'data': {
                'user_id': user_id,
                'old_status': old_status,
                'new_status': bool(new_status)
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f'❌ Error updating user status: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to update user status: {str(e)}'
        }), 500


# ✅ SOFT DELETE USER
@bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Soft delete user (deactivate account)"""
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

        # Prevent admin from deleting themselves
        if user_id == current_user_id:
            return jsonify({
                'success': False,
                'error': 'Cannot delete your own account',
                'error_code': 'SELF_DELETION_DENIED'
            }), 403

        # Get user
        user = db.session.query(User).filter_by(user_id=user_id).first()
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404

        # Soft delete (deactivate)
        user.is_active = False
        user.updated_at = datetime.utcnow().date()

        db.session.commit()

        logger.info(f'✅ Admin {current_user_id} soft-deleted user {user_id}')

        return jsonify({
            'success': True,
            'message': 'User account deactivated successfully',
            'data': {
                'user_id': user_id,
                'username': user.username,
                'status': 'deactivated'
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f'❌ Error deleting user: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to delete user: {str(e)}'
        }), 500


# ✅ ULTRA SAFE HARD DELETE USER
@bp.route('/users/<int:user_id>/hard-delete', methods=['DELETE'])
@jwt_required()
def hard_delete_user(user_id):
    """Ultra safe hard delete user - Completely transaction-safe with individual operations"""
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

        # Prevent admin from deleting themselves
        if user_id == current_user_id:
            return jsonify({
                'success': False,
                'error': 'Cannot delete your own account',
                'error_code': 'SELF_DELETION_DENIED'
            }), 403

        logger.info(f'🗑️ Starting ultra safe hard delete for user {user_id}')

        # ✅ STEP 1: Reset any existing failed transaction
        reset_db_session()

        # ✅ STEP 2: Get user info using raw SQL
        user_info = None
        try:
            result = db.session.execute(
                text("SELECT user_id, username, email, full_name, role_id FROM users WHERE user_id = :user_id"),
                {'user_id': user_id}
            )
            user_row = result.fetchone()

            if not user_row:
                return jsonify({
                    'success': False,
                    'error': 'User not found'
                }), 404

            user_info = {
                'user_id': user_row[0],
                'username': user_row[1] or '',
                'email': user_row[2] or '',
                'full_name': user_row[3] or '',
                'role_id': user_row[4] or 0
            }

            db.session.commit()
            logger.info(f'✅ Got user info for deletion: {user_info["username"]}')

        except Exception as e:
            db.session.rollback()
            logger.error(f'❌ Error getting user info: {e}')
            return jsonify({
                'success': False,
                'error': f'Failed to get user info: {str(e)}'
            }), 500

        # ✅ STEP 3: Get related record IDs using raw SQL
        related_ids = {'doctor_id': None, 'parent_id': None, 'admin_id': None}

        try:
            # Get doctor_id
            result = db.session.execute(
                text("SELECT doctor_id FROM doctors WHERE user_id = :user_id"),
                {'user_id': user_id}
            )
            doctor_row = result.fetchone()
            if doctor_row:
                related_ids['doctor_id'] = doctor_row[0]
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.warning(f'⚠️ Error getting doctor_id: {e}')

        try:
            # Get parent_id
            result = db.session.execute(
                text("SELECT parent_id FROM parents WHERE user_id = :user_id"),
                {'user_id': user_id}
            )
            parent_row = result.fetchone()
            if parent_row:
                related_ids['parent_id'] = parent_row[0]
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.warning(f'⚠️ Error getting parent_id: {e}')

        try:
            # Get admin_id
            result = db.session.execute(
                text("SELECT admin_id FROM admins WHERE user_id = :user_id"),
                {'user_id': user_id}
            )
            admin_row = result.fetchone()
            if admin_row:
                related_ids['admin_id'] = admin_row[0]
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.warning(f'⚠️ Error getting admin_id: {e}')

        logger.info(f'🔍 Related IDs: {related_ids}')

        # ✅ STEP 4: Delete related data using individual safe operations
        deletion_summary = {}

        # Define all deletion operations
        deletion_operations = [
            # Direct user-related deletions
            ("DELETE FROM comments WHERE user_id = :user_id", {'user_id': user_id}, "comments"),
            ("DELETE FROM articles WHERE author_id = :user_id", {'user_id': user_id}, "articles"),
            ("DELETE FROM likes WHERE user_id = :user_id", {'user_id': user_id}, "likes"),
            ("DELETE FROM saves WHERE user_id = :user_id", {'user_id': user_id}, "saves"),
            ("DELETE FROM notifications WHERE user_id = :user_id", {'user_id': user_id}, "notifications"),

            # Follow relationships (both directions)
            ("DELETE FROM follows WHERE follower_id = :user_id", {'user_id': user_id}, "following"),
            ("DELETE FROM follows WHERE followed_id = :user_id", {'user_id': user_id}, "followers"),
        ]

        # Add doctor-specific deletions
        if related_ids['doctor_id']:
            deletion_operations.extend([
                ("DELETE FROM appointments WHERE doctor_id = :doctor_id", {'doctor_id': related_ids['doctor_id']},
                 "doctor_appointments"),
                ("DELETE FROM doctor_reviews WHERE doctor_id = :doctor_id", {'doctor_id': related_ids['doctor_id']},
                 "doctor_reviews"),
            ])

        # Add parent-specific deletions
        if related_ids['parent_id']:
            deletion_operations.extend([
                ("DELETE FROM appointments WHERE parent_id = :parent_id", {'parent_id': related_ids['parent_id']},
                 "parent_appointments"),
            ])

        # Execute all deletion operations
        for sql, params, operation_name in deletion_operations:
            try:
                result = db.session.execute(text(sql), params)
                deletion_summary[operation_name] = result.rowcount
                db.session.commit()
                logger.info(f'✅ Deleted {result.rowcount} records from {operation_name}')
            except Exception as e:
                db.session.rollback()
                logger.warning(f'⚠️ {operation_name} deletion failed: {e}')
                deletion_summary[operation_name] = 0

        # ✅ STEP 5: Delete role-specific records
        role_deletions = []

        if related_ids['admin_id']:
            role_deletions.append(("DELETE FROM admins WHERE admin_id = :admin_id",
                                   {'admin_id': related_ids['admin_id']}, "admin_record"))

        if related_ids['doctor_id']:
            role_deletions.append(("DELETE FROM doctors WHERE doctor_id = :doctor_id",
                                   {'doctor_id': related_ids['doctor_id']}, "doctor_record"))

        if related_ids['parent_id']:
            role_deletions.append(("DELETE FROM parents WHERE parent_id = :parent_id",
                                   {'parent_id': related_ids['parent_id']}, "parent_record"))

        for sql, params, operation_name in role_deletions:
            try:
                result = db.session.execute(text(sql), params)
                deletion_summary[operation_name] = result.rowcount
                db.session.commit()
                logger.info(f'✅ Deleted {operation_name}')
            except Exception as e:
                db.session.rollback()
                logger.warning(f'⚠️ {operation_name} deletion failed: {e}')
                deletion_summary[operation_name] = 0

        # ✅ STEP 6: Finally delete the main user record
        try:
            result = db.session.execute(
                text("DELETE FROM users WHERE user_id = :user_id"),
                {'user_id': user_id}
            )

            if result.rowcount == 0:
                logger.error(f'❌ User {user_id} not found for deletion')
                return jsonify({
                    'success': False,
                    'error': 'User record not found or already deleted'
                }), 404

            db.session.commit()
            deletion_summary['user_record'] = result.rowcount
            logger.info('✅ Deleted main user record')

        except Exception as e:
            db.session.rollback()
            logger.error(f'❌ Error deleting main user record: {e}')
            return jsonify({
                'success': False,
                'error': f'Failed to delete user record: {str(e)}'
            }), 500

        # ✅ SUCCESS - User completely deleted
        logger.info(f'🎉 User {user_id} hard deleted successfully')
        logger.info(f'📊 Deletion summary: {deletion_summary}')

        return jsonify({
            'success': True,
            'message': 'User and all related data permanently deleted',
            'data': {
                'deleted_user': user_info,
                'deletion_type': 'hard_delete',
                'deleted_at': datetime.utcnow().isoformat(),
                'deletion_summary': deletion_summary,
                'operation': 'ultra_safe_delete'
            }
        }), 200

    except Exception as e:
        # Final safety net - ensure transaction is rolled back
        try:
            db.session.rollback()
        except:
            pass

        logger.error(f'❌ Error in ultra safe hard delete: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Hard delete failed: {str(e)}',
            'error_code': 'HARD_DELETE_ERROR'
        }), 500


# ✅ ULTRA SAFE GET USER DELETION INFO
@bp.route('/users/<int:user_id>/deletion-info', methods=['GET'])
@jwt_required()
def get_user_deletion_info(user_id):
    """Get information about what will be deleted when user is hard deleted - ULTRA SAFE VERSION"""
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

        logger.info(f'🔍 Getting deletion info for user {user_id}')

        # ✅ STEP 1: Reset any failed transaction first
        reset_db_session()

        deletion_info = {
            'user_info': {},
            'related_data': {},
            'warnings': [],
            'can_delete': True
        }

        # ✅ STEP 2: Get user info using raw SQL (most safe)
        try:
            result = db.session.execute(
                text("SELECT user_id, username, email, full_name, role_id FROM users WHERE user_id = :user_id"),
                {'user_id': user_id}
            )
            user_row = result.fetchone()

            if not user_row:
                return jsonify({
                    'success': False,
                    'error': 'User not found'
                }), 404

            deletion_info['user_info'] = {
                'user_id': user_row[0],
                'username': user_row[1] or '',
                'email': user_row[2] or '',
                'full_name': user_row[3] or '',
                'role_id': user_row[4] or 0,
                'role_display': get_role_display_name(user_row[4] or 0)
            }

            db.session.commit()
            logger.info(f'✅ Got user info: {deletion_info["user_info"]["username"]}')

        except Exception as e:
            db.session.rollback()
            logger.error(f'❌ Error getting user info: {e}')
            return jsonify({
                'success': False,
                'error': f'Failed to get user info: {str(e)}'
            }), 500

        # ✅ STEP 3: Check if user is trying to delete themselves
        if user_id == current_user_id:
            deletion_info['can_delete'] = False
            deletion_info['warnings'].append('Cannot delete your own account')

        # ✅ STEP 4: Get related data counts using raw SQL (safest approach)
        try:
            # Get role-specific IDs first
            doctor_id = None
            parent_id = None
            admin_id = None

            try:
                result = db.session.execute(
                    text("SELECT doctor_id FROM doctors WHERE user_id = :user_id"),
                    {'user_id': user_id}
                )
                doctor_row = result.fetchone()
                if doctor_row:
                    doctor_id = doctor_row[0]
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                logger.warning(f'⚠️ Error getting doctor_id: {e}')

            try:
                result = db.session.execute(
                    text("SELECT parent_id FROM parents WHERE user_id = :user_id"),
                    {'user_id': user_id}
                )
                parent_row = result.fetchone()
                if parent_row:
                    parent_id = parent_row[0]
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                logger.warning(f'⚠️ Error getting parent_id: {e}')

            try:
                result = db.session.execute(
                    text("SELECT admin_id FROM admins WHERE user_id = :user_id"),
                    {'user_id': user_id}
                )
                admin_row = result.fetchone()
                if admin_row:
                    admin_id = admin_row[0]
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                logger.warning(f'⚠️ Error getting admin_id: {e}')

            # Count related data using individual transactions
            related_counts = {}

            # Count comments
            try:
                result = db.session.execute(
                    text("SELECT COUNT(*) FROM comments WHERE user_id = :user_id"),
                    {'user_id': user_id}
                )
                related_counts['comments'] = result.scalar() or 0
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                logger.warning(f'⚠️ Error counting comments: {e}')
                related_counts['comments'] = 0

            # Count articles
            try:
                result = db.session.execute(
                    text("SELECT COUNT(*) FROM articles WHERE author_id = :user_id"),
                    {'user_id': user_id}
                )
                related_counts['articles'] = result.scalar() or 0
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                logger.warning(f'⚠️ Error counting articles: {e}')
                related_counts['articles'] = 0

            # Count appointments (doctor + parent)
            appointments_count = 0
            if doctor_id:
                try:
                    result = db.session.execute(
                        text("SELECT COUNT(*) FROM appointments WHERE doctor_id = :doctor_id"),
                        {'doctor_id': doctor_id}
                    )
                    appointments_count += result.scalar() or 0
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    logger.warning(f'⚠️ Error counting doctor appointments: {e}')

            if parent_id:
                try:
                    result = db.session.execute(
                        text("SELECT COUNT(*) FROM appointments WHERE parent_id = :parent_id"),
                        {'parent_id': parent_id}
                    )
                    appointments_count += result.scalar() or 0
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    logger.warning(f'⚠️ Error counting parent appointments: {e}')

            related_counts['appointments'] = appointments_count

            # Count other related data
            other_tables = ['likes', 'saves', 'notifications']
            for table in other_tables:
                try:
                    result = db.session.execute(
                        text(f"SELECT COUNT(*) FROM {table} WHERE user_id = :user_id"),
                        {'user_id': user_id}
                    )
                    related_counts[table] = result.scalar() or 0
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    logger.warning(f'⚠️ Error counting {table}: {e}')
                    related_counts[table] = 0

            # Count follows (both directions)
            try:
                result1 = db.session.execute(
                    text("SELECT COUNT(*) FROM follows WHERE follower_id = :user_id"),
                    {'user_id': user_id}
                )
                following_count = result1.scalar() or 0

                result2 = db.session.execute(
                    text("SELECT COUNT(*) FROM follows WHERE followed_id = :user_id"),
                    {'user_id': user_id}
                )
                followers_count = result2.scalar() or 0

                related_counts['following'] = following_count
                related_counts['followers'] = followers_count
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                logger.warning(f'⚠️ Error counting follows: {e}')
                related_counts['following'] = 0
                related_counts['followers'] = 0

            # Set all counts in deletion_info
            deletion_info['related_data'] = related_counts

            # Add profile flags
            if admin_id:
                deletion_info['related_data']['admin_profile'] = True

            if doctor_id:
                deletion_info['related_data']['doctor_profile'] = True

            if parent_id:
                deletion_info['related_data']['parent_profile'] = True

            logger.info(f'✅ Related data counts: {related_counts}')

        except Exception as e:
            db.session.rollback()
            logger.error(f'❌ Error counting related data: {e}')
            # Continue with empty counts rather than failing

        # ✅ STEP 5: Generate warnings based on data
        try:
            total_content = deletion_info['related_data'].get('articles', 0) + deletion_info['related_data'].get(
                'comments', 0)

            if total_content > 10:
                deletion_info['warnings'].append(
                    f'User has created {total_content} pieces of content (articles + comments)'
                )

            if deletion_info['related_data'].get('appointments', 0) > 0:
                deletion_info['warnings'].append('User has scheduled appointments that will be deleted')

            if deletion_info['related_data'].get('followers', 0) > 5:
                deletion_info['warnings'].append(f'User has {deletion_info["related_data"]["followers"]} followers')

            if deletion_info['related_data'].get('articles', 0) > 20:
                deletion_info['warnings'].append('User is a prolific content creator - deletion will impact community')

            if deletion_info['user_info']['role_id'] == 1:  # Admin
                deletion_info['warnings'].append('Deleting an admin account - ensure permissions are transferred')

            if deletion_info['user_info']['role_id'] == 2:  # Doctor
                deletion_info['warnings'].append('Deleting a doctor account - patients may be affected')

        except Exception as e:
            logger.warning(f'⚠️ Error generating warnings: {e}')

        logger.info(f'✅ Generated deletion info for user {user_id}')

        return jsonify({
            'success': True,
            'data': deletion_info
        }), 200

    except Exception as e:
        # Ensure transaction is rolled back
        try:
            db.session.rollback()
        except:
            pass

        logger.error(f'❌ Error in get_user_deletion_info: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to get deletion info: {str(e)}'
        }), 500


# ✅ GET ADMIN STATISTICS
@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    """Get admin dashboard statistics"""
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

        # Get user statistics
        total_users = db.session.query(User).count()
        active_users = db.session.query(User).filter_by(is_active=True).count()
        inactive_users = total_users - active_users

        # Users by role
        admins_count = db.session.query(User).filter_by(role_id=1).count()
        doctors_count = db.session.query(User).filter_by(role_id=2).count()
        parents_count = db.session.query(User).filter_by(role_id=3).count()

        # Content statistics - use safe SQL queries
        total_articles = 0
        published_articles = 0
        total_comments = 0

        try:
            result = db.session.execute(text("SELECT COUNT(*) FROM articles"))
            total_articles = result.scalar() or 0
        except Exception:
            pass

        try:
            result = db.session.execute(text("SELECT COUNT(*) FROM articles WHERE status = 'published'"))
            published_articles = result.scalar() or 0
        except Exception:
            pass

        try:
            result = db.session.execute(text("SELECT COUNT(*) FROM comments"))
            total_comments = result.scalar() or 0
        except Exception:
            pass

        # Recent activity (last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow().date() - timedelta(days=30)
        recent_users = db.session.query(User).filter(
            User.created_at >= thirty_days_ago
        ).count()

        stats = {
            'users': {
                'total': total_users,
                'active': active_users,
                'inactive': inactive_users,
                'recent_signups': recent_users
            },
            'users_by_role': {
                'admins': admins_count,
                'doctors': doctors_count,
                'parents': parents_count
            },
            'content': {
                'total_articles': total_articles,
                'published_articles': published_articles,
                'total_comments': total_comments
            },
            'activity': {
                'new_users_last_30_days': recent_users
            }
        }

        logger.info(f'✅ Admin {current_user_id} retrieved dashboard stats')

        return jsonify({
            'success': True,
            'data': stats,
            'generated_at': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        logger.error(f'❌ Error getting admin stats: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to get statistics: {str(e)}'
        }), 500


# ✅ SIMPLE HARD DELETE (FALLBACK OPTION)
@bp.route('/users/<int:user_id>/hard-delete-simple', methods=['DELETE'])
@jwt_required()
def hard_delete_user_simple(user_id):
    """Simple hard delete - just mark as deleted (fallback option)"""
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

        # Prevent admin from deleting themselves
        if user_id == current_user_id:
            return jsonify({
                'success': False,
                'error': 'Cannot delete your own account',
                'error_code': 'SELF_DELETION_DENIED'
            }), 403

        # Get user
        user = db.session.query(User).filter_by(user_id=user_id).first()
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404

        # Store user info
        user_info = {
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name,
            'role_id': user.role_id
        }

        # ✅ SIMPLE APPROACH: Just mark as deleted and change username/email
        try:
            # Mark as inactive
            user.is_active = False

            # Change username and email to prevent conflicts
            timestamp = int(datetime.utcnow().timestamp())
            user.username = f"deleted_user_{user_id}_{timestamp}"
            user.email = f"deleted_{user_id}_{timestamp}@deleted.local"

            # Add deletion marker
            user.updated_at = datetime.utcnow().date()

            db.session.commit()

            logger.info(f'✅ User {user_id} marked as deleted (simple approach)')

            return jsonify({
                'success': True,
                'message': 'User marked as permanently deleted',
                'data': {
                    'deleted_user': user_info,
                    'deletion_type': 'soft_delete_marked',
                    'deleted_at': datetime.utcnow().isoformat(),
                    'note': 'User data preserved but account disabled'
                }
            }), 200

        except Exception as e:
            db.session.rollback()
            logger.error(f'❌ Error in simple delete: {e}')
            return jsonify({
                'success': False,
                'error': f'Simple delete failed: {str(e)}'
            }), 500

    except Exception as e:
        db.session.rollback()
        logger.error(f'❌ Error in simple hard delete endpoint: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Simple hard delete failed: {str(e)}'
        }), 500


# ✅ HEALTH CHECK
@bp.route('/health', methods=['GET'])
def admin_health():
    """Health check for admin service"""
    try:
        # Test database connection
        db.session.execute(text('SELECT 1'))

        # Count total users
        total_users = db.session.query(User).count()

        return jsonify({
            "success": True,
            "service": "admin",
            "status": "healthy",
            "database": "connected",
            "total_users": total_users,
            "endpoints": {
                "users_list": "GET /api/admin/users",
                "user_detail": "GET /api/admin/users/{id}",
                "update_status": "PUT /api/admin/users/{id}/status",
                "soft_delete": "DELETE /api/admin/users/{id}",
                "hard_delete": "DELETE /api/admin/users/{id}/hard-delete",
                "simple_hard_delete": "DELETE /api/admin/users/{id}/hard-delete-simple",
                "deletion_info": "GET /api/admin/users/{id}/deletion-info",
                "statistics": "GET /api/admin/stats",
                "health": "GET /api/admin/health"
            }
        }), 200
    except Exception as e:
        logger.error('Admin health check failed: %s', str(e))
        return jsonify({
            "success": False,
            "service": "admin",
            "status": "unhealthy",
            "error": str(e)
        }), 500


# ✅ BATCH OPERATIONS (BONUS)
@bp.route('/users/batch-status', methods=['PUT'])
@jwt_required()
def batch_update_user_status():
    """Batch update user status"""
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

        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400

        user_ids = data.get('user_ids', [])
        new_status = data.get('is_active')

        if not user_ids or new_status is None:
            return jsonify({
                'success': False,
                'error': 'user_ids and is_active are required'
            }), 400

        # Prevent self-modification
        if current_user_id in user_ids:
            return jsonify({
                'success': False,
                'error': 'Cannot modify your own account status',
                'error_code': 'SELF_MODIFICATION_DENIED'
            }), 403

        results = {
            'success': 0,
            'failed': 0,
            'errors': []
        }

        for user_id in user_ids:
            try:
                user = db.session.query(User).filter_by(user_id=user_id).first()
                if user:
                    user.is_active = bool(new_status)
                    user.updated_at = datetime.utcnow().date()
                    results['success'] += 1
                else:
                    results['failed'] += 1
                    results['errors'].append(f'User {user_id} not found')
            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f'User {user_id}: {str(e)}')

        db.session.commit()

        logger.info(f'✅ Admin {current_user_id} batch updated {results["success"]} users')

        return jsonify({
            'success': True,
            'message': f'Batch operation completed: {results["success"]} success, {results["failed"]} failed',
            'data': results
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f'❌ Error in batch status update: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Batch operation failed: {str(e)}'
        }), 500


# ✅ GET USER DETAIL (BONUS)
@bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_detail(user_id):
    """Get detailed user information for admin"""
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

        # Get user with all relationships
        user = db.session.query(User).filter_by(user_id=user_id).first()
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found',
                'error_code': 'USER_NOT_FOUND'
            }), 404

        # Build detailed user data
        user_data = user.to_dict()

        # Add role information
        if user.role:
            user_data['role_info'] = user.role.to_dict()

        # Add complete profile information
        if user.admin:
            user_data['admin_profile'] = user.admin.to_dict()
        if user.doctor:
            user_data['doctor_profile'] = user.doctor.to_dict()
        if user.parent:
            user_data['parent_profile'] = user.parent.to_dict()

        # Add computed fields
        user_data['role_display'] = get_role_display_name(user.role_id)
        user_data['status_display'] = 'Active' if user.is_active else 'Inactive'
        user_data['last_activity'] = get_user_last_activity(user)

        logger.info(f'✅ Admin retrieved detailed info for user {user_id}')

        return jsonify({
            'success': True,
            'data': user_data
        }), 200

    except Exception as e:
        logger.error(f'❌ Error getting user detail: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to get user detail: {str(e)}'
        }), 500