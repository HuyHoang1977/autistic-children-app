import logging
from datetime import datetime
from typing import List, Optional
from app.models.articles_model import Article
from app.models.users_model import User
from app.models.admins_model import Admin
from app.extensions import db
from sqlalchemy import text

logger = logging.getLogger(__name__)


class ArticleNotificationService:
    """Service for handling article-related notifications"""

    def __init__(self):
        self.notification_types = {
            'NEW_ARTICLE_PENDING': 'new_article_pending',
            'ARTICLE_APPROVED': 'article_approved',
            'ARTICLE_REJECTED': 'article_rejected',
            'ARTICLE_FEATURED': 'article_featured'
        }

    async def notify_admins_new_article(self, article: Article) -> bool:
        """
        Notify all admins when a new article is submitted for review

        Args:
            article: The article that was submitted

        Returns:
            bool: True if notifications were sent successfully
        """
        try:
            # Get all active admins
            admins = self.get_active_admins()

            if not admins:
                logger.warning("No active admins found to notify")
                return False

            # Create notification content
            notification_data = {
                'title': 'Bài viết mới cần duyệt',
                'message': f'Bài viết "{article.title}" từ tác giả {article.author.full_name} đang chờ duyệt.',
                'type': self.notification_types['NEW_ARTICLE_PENDING'],
                'article_id': article.article_id,
                'author_id': article.author_id,
                'created_at': datetime.utcnow()
            }

            # Send notification to each admin
            success_count = 0
            for admin in admins:
                try:
                    if await self.send_notification_to_admin(admin.user_id, notification_data):
                        success_count += 1
                except Exception as e:
                    logger.error(f"Failed to notify admin {admin.user_id}: {str(e)}")

            logger.info(
                f"Successfully notified {success_count}/{len(admins)} admins about new article {article.article_id}")
            return success_count > 0

        except Exception as e:
            logger.error(f"Error notifying admins about new article: {str(e)}")
            return False

    async def notify_author_article_approved(self, article: Article, admin_id: int) -> bool:
        """
        Notify author when their article is approved

        Args:
            article: The approved article
            admin_id: ID of the admin who approved

        Returns:
            bool: True if notification was sent successfully
        """
        try:
            # Get admin info
            admin = db.session.query(User).filter_by(user_id=admin_id).first()
            admin_name = admin.full_name if admin else "Admin"

            notification_data = {
                'title': 'Bài viết đã được duyệt',
                'message': f'Bài viết "{article.title}" của bạn đã được {admin_name} duyệt và xuất bản.',
                'type': self.notification_types['ARTICLE_APPROVED'],
                'article_id': article.article_id,
                'admin_id': admin_id,
                'created_at': datetime.utcnow()
            }

            success = await self.send_notification_to_user(article.author_id, notification_data)

            if success:
                logger.info(f"Notified author {article.author_id} about approved article {article.article_id}")

            return success

        except Exception as e:
            logger.error(f"Error notifying author about approved article: {str(e)}")
            return False

    async def notify_author_article_rejected(self, article: Article, admin_id: int, reason: str) -> bool:
        """
        Notify author when their article is rejected

        Args:
            article: The rejected article
            admin_id: ID of the admin who rejected
            reason: Rejection reason

        Returns:
            bool: True if notification was sent successfully
        """
        try:
            # Get admin info
            admin = db.session.query(User).filter_by(user_id=admin_id).first()
            admin_name = admin.full_name if admin else "Admin"

            notification_data = {
                'title': 'Bài viết bị từ chối',
                'message': f'Bài viết "{article.title}" của bạn đã bị {admin_name} từ chối. Lý do: {reason}',
                'type': self.notification_types['ARTICLE_REJECTED'],
                'article_id': article.article_id,
                'admin_id': admin_id,
                'rejection_reason': reason,
                'created_at': datetime.utcnow()
            }

            success = await self.send_notification_to_user(article.author_id, notification_data)

            if success:
                logger.info(f"Notified author {article.author_id} about rejected article {article.article_id}")

            return success

        except Exception as e:
            logger.error(f"Error notifying author about rejected article: {str(e)}")
            return False

    async def notify_author_article_featured(self, article: Article, admin_id: int) -> bool:
        """
        Notify author when their article is featured

        Args:
            article: The featured article
            admin_id: ID of the admin who featured it

        Returns:
            bool: True if notification was sent successfully
        """
        try:
            # Get admin info
            admin = db.session.query(User).filter_by(user_id=admin_id).first()
            admin_name = admin.full_name if admin else "Admin"

            notification_data = {
                'title': 'Bài viết được chọn nổi bật',
                'message': f'Bài viết "{article.title}" của bạn đã được {admin_name} chọn làm bài viết nổi bật.',
                'type': self.notification_types['ARTICLE_FEATURED'],
                'article_id': article.article_id,
                'admin_id': admin_id,
                'created_at': datetime.utcnow()
            }

            success = await self.send_notification_to_user(article.author_id, notification_data)

            if success:
                logger.info(f"Notified author {article.author_id} about featured article {article.article_id}")

            return success

        except Exception as e:
            logger.error(f"Error notifying author about featured article: {str(e)}")
            return False

    def get_active_admins(self) -> List[Admin]:
        """Get all active admin users"""
        try:
            admins = db.session.query(Admin).join(User).filter(
                User.is_active == True,
                User.role_id == 1
            ).all()

            return admins

        except Exception as e:
            logger.error(f"Error getting active admins: {str(e)}")
            return []

    async def send_notification_to_admin(self, admin_id: int, notification_data: dict) -> bool:
        """
        Send notification to a specific admin

        Args:
            admin_id: ID of the admin user
            notification_data: Notification content

        Returns:
            bool: True if notification was sent successfully
        """
        try:
            # Here you would integrate with your notification system
            # For now, we'll just log and store in database

            # Store in database (assuming you have a notifications table)
            notification_record = {
                'user_id': admin_id,
                'title': notification_data['title'],
                'message': notification_data['message'],
                'type': notification_data['type'],
                'data': notification_data,
                'is_read': False,
                'created_at': datetime.utcnow()
            }

            # Insert notification (replace with your actual notification model)
            db.session.execute(text("""
                INSERT INTO notifications (user_id, title, message, type, data, is_read, created_at)
                VALUES (:user_id, :title, :message, :type, :data, :is_read, :created_at)
            """), {
                'user_id': admin_id,
                'title': notification_data['title'],
                'message': notification_data['message'],
                'type': notification_data['type'],
                'data': str(notification_data),
                'is_read': False,
                'created_at': datetime.utcnow()
            })

            db.session.commit()

            # Here you could also send:
            # - Email notification
            # - Push notification
            # - WebSocket real-time notification
            # - SMS notification

            await self.send_email_notification(admin_id, notification_data)
            await self.send_websocket_notification(admin_id, notification_data)

            return True

        except Exception as e:
            logger.error(f"Error sending notification to admin {admin_id}: {str(e)}")
            return False

    async def send_notification_to_user(self, user_id: int, notification_data: dict) -> bool:
        """
        Send notification to a specific user

        Args:
            user_id: ID of the user
            notification_data: Notification content

        Returns:
            bool: True if notification was sent successfully
        """
        try:
            # Store notification in database
            db.session.execute(text("""
                INSERT INTO notifications (user_id, title, message, type, data, is_read, created_at)
                VALUES (:user_id, :title, :message, :type, :data, :is_read, :created_at)
            """), {
                'user_id': user_id,
                'title': notification_data['title'],
                'message': notification_data['message'],
                'type': notification_data['type'],
                'data': str(notification_data),
                'is_read': False,
                'created_at': datetime.utcnow()
            })

            db.session.commit()

            # Send additional notifications
            await self.send_email_notification(user_id, notification_data)
            await self.send_websocket_notification(user_id, notification_data)

            return True

        except Exception as e:
            logger.error(f"Error sending notification to user {user_id}: {str(e)}")
            return False

    async def send_email_notification(self, user_id: int, notification_data: dict) -> bool:
        """
        Send email notification to user

        Args:
            user_id: ID of the user
            notification_data: Notification content

        Returns:
            bool: True if email was sent successfully
        """
        try:
            # Get user email
            user = db.session.query(User).filter_by(user_id=user_id).first()
            if not user or not user.email:
                return False

            # Create email content based on notification type
            email_subject = notification_data['title']
            email_body = self.create_email_body(notification_data)

            # Here you would integrate with your email service
            # For example: SendGrid, AWS SES, SMTP, etc.

            logger.info(f"Email notification sent to {user.email}: {email_subject}")
            return True

        except Exception as e:
            logger.error(f"Error sending email notification: {str(e)}")
            return False

    async def send_websocket_notification(self, user_id: int, notification_data: dict) -> bool:
        """
        Send real-time WebSocket notification

        Args:
            user_id: ID of the user
            notification_data: Notification content

        Returns:
            bool: True if WebSocket notification was sent successfully
        """
        try:
            # Here you would integrate with your WebSocket service
            # For example: Socket.IO, Flask-SocketIO, etc.

            websocket_payload = {
                'type': 'notification',
                'data': notification_data,
                'timestamp': datetime.utcnow().isoformat()
            }

            # Example WebSocket emit (replace with your actual implementation)
            # socketio.emit('notification', websocket_payload, room=f'user_{user_id}')

            logger.info(f"WebSocket notification sent to user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Error sending WebSocket notification: {str(e)}")
            return False

    def create_email_body(self, notification_data: dict) -> str:
        """
        Create email body based on notification type

        Args:
            notification_data: Notification content

        Returns:
            str: Formatted email body
        """
        notification_type = notification_data['type']

        if notification_type == self.notification_types['NEW_ARTICLE_PENDING']:
            return f"""
            <html>
            <body>
                <h2>Bài viết mới cần duyệt</h2>
                <p>Có bài viết mới cần được duyệt:</p>
                <ul>
                    <li><strong>Tiêu đề:</strong> {notification_data.get('title', 'N/A')}</li>
                    <li><strong>Tác giả:</strong> {notification_data.get('author_name', 'N/A')}</li>
                    <li><strong>Ngày gửi:</strong> {notification_data['created_at'].strftime('%d/%m/%Y %H:%M')}</li>
                </ul>
                <p><a href="http://localhost:3000/admin/articles/{notification_data['article_id']}">Xem chi tiết và duyệt bài</a></p>
            </body>
            </html>
            """

        elif notification_type == self.notification_types['ARTICLE_APPROVED']:
            return f"""
            <html>
            <body>
                <h2>Bài viết đã được duyệt</h2>
                <p>Chúc mừng! Bài viết của bạn đã được duyệt và xuất bản.</p>
                <ul>
                    <li><strong>Tiêu đề:</strong> {notification_data.get('title', 'N/A')}</li>
                    <li><strong>Ngày duyệt:</strong> {notification_data['created_at'].strftime('%d/%m/%Y %H:%M')}</li>
                </ul>
                <p><a href="http://localhost:3000/articles/{notification_data['article_id']}">Xem bài viết</a></p>
            </body>
            </html>
            """

        elif notification_type == self.notification_types['ARTICLE_REJECTED']:
            return f"""
            <html>
            <body>
                <h2>Bài viết bị từ chối</h2>
                <p>Bài viết của bạn đã bị từ chối. Vui lòng chỉnh sửa và gửi lại.</p>
                <ul>
                    <li><strong>Tiêu đề:</strong> {notification_data.get('title', 'N/A')}</li>
                    <li><strong>Lý do từ chối:</strong> {notification_data.get('rejection_reason', 'N/A')}</li>
                    <li><strong>Ngày từ chối:</strong> {notification_data['created_at'].strftime('%d/%m/%Y %H:%M')}</li>
                </ul>
                <p><a href="http://localhost:3000/my-articles">Chỉnh sửa bài viết</a></p>
            </body>
            </html>
            """

        elif notification_type == self.notification_types['ARTICLE_FEATURED']:
            return f"""
            <html>
            <body>
                <h2>Bài viết được chọn nổi bật</h2>
                <p>Chúc mừng! Bài viết của bạn đã được chọn làm bài viết nổi bật.</p>
                <ul>
                    <li><strong>Tiêu đề:</strong> {notification_data.get('title', 'N/A')}</li>
                    <li><strong>Ngày chọn:</strong> {notification_data['created_at'].strftime('%d/%m/%Y %H:%M')}</li>
                </ul>
                <p><a href="http://localhost:3000/articles/{notification_data['article_id']}">Xem bài viết</a></p>
            </body>
            </html>
            """

        else:
            return f"""
            <html>
            <body>
                <h2>{notification_data['title']}</h2>
                <p>{notification_data['message']}</p>
            </body>
            </html>
            """

    async def send_bulk_notification_to_admins(self, notification_data: dict) -> dict:
        """
        Send notification to all admins

        Args:
            notification_data: Notification content

        Returns:
            dict: Results of bulk notification
        """
        try:
            admins = self.get_active_admins()

            results = {
                'total_admins': len(admins),
                'successful': 0,
                'failed': 0,
                'errors': []
            }

            for admin in admins:
                try:
                    success = await self.send_notification_to_admin(admin.user_id, notification_data)
                    if success:
                        results['successful'] += 1
                    else:
                        results['failed'] += 1
                except Exception as e:
                    results['failed'] += 1
                    results['errors'].append(f"Admin {admin.user_id}: {str(e)}")

            return results

        except Exception as e:
            logger.error(f"Error in bulk notification: {str(e)}")
            return {
                'total_admins': 0,
                'successful': 0,
                'failed': 0,
                'errors': [str(e)]
            }

    def get_pending_articles_count(self) -> int:
        """Get count of pending articles"""
        try:
            count = db.session.query(Article).filter_by(status='pending').count()
            return count
        except Exception as e:
            logger.error(f"Error getting pending articles count: {str(e)}")
            return 0

    def get_urgent_articles(self, hours: int = 24) -> List[Article]:
        """
        Get articles that have been pending for more than specified hours

        Args:
            hours: Number of hours to consider as urgent

        Returns:
            List[Article]: List of urgent articles
        """
        try:
            from datetime import timedelta

            urgent_threshold = datetime.utcnow() - timedelta(hours=hours)

            articles = db.session.query(Article).filter(
                Article.status == 'pending',
                Article.created_at < urgent_threshold
            ).order_by(Article.created_at.asc()).all()

            return articles

        except Exception as e:
            logger.error(f"Error getting urgent articles: {str(e)}")
            return []

    async def send_daily_pending_summary(self) -> bool:
        """
        Send daily summary of pending articles to admins

        Returns:
            bool: True if summary was sent successfully
        """
        try:
            pending_count = self.get_pending_articles_count()
            urgent_articles = self.get_urgent_articles(24)

            if pending_count == 0:
                logger.info("No pending articles to report")
                return True

            # Create summary notification
            notification_data = {
                'title': f'Báo cáo hàng ngày - {pending_count} bài viết chờ duyệt',
                'message': f'Hiện có {pending_count} bài viết đang chờ duyệt, trong đó {len(urgent_articles)} bài đã quá 24 giờ.',
                'type': 'daily_summary',
                'pending_count': pending_count,
                'urgent_count': len(urgent_articles),
                'created_at': datetime.utcnow()
            }

            # Send to all admins
            results = await self.send_bulk_notification_to_admins(notification_data)

            logger.info(f"Daily summary sent: {results['successful']}/{results['total_admins']} admins notified")
            return results['successful'] > 0

        except Exception as e:
            logger.error(f"Error sending daily summary: {str(e)}")
            return False

    async def send_weekly_statistics(self) -> bool:
        """
        Send weekly statistics to admins

        Returns:
            bool: True if statistics were sent successfully
        """
        try:
            from datetime import timedelta

            # Get statistics for the last week
            week_ago = datetime.utcnow() - timedelta(days=7)

            # Articles created this week
            articles_this_week = db.session.query(Article).filter(
                Article.created_at >= week_ago
            ).count()

            # Articles approved this week
            approved_this_week = db.session.query(Article).filter(
                Article.reviewed_at >= week_ago,
                Article.status == 'published'
            ).count()

            # Articles rejected this week
            rejected_this_week = db.session.query(Article).filter(
                Article.reviewed_at >= week_ago,
                Article.status == 'rejected'
            ).count()

            # Current pending count
            pending_count = self.get_pending_articles_count()

            # Create statistics notification
            notification_data = {
                'title': 'Báo cáo tuần - Thống kê bài viết',
                'message': f'Tuần qua: {articles_this_week} bài mới, {approved_this_week} bài được duyệt, {rejected_this_week} bài bị từ chối. Hiện có {pending_count} bài chờ duyệt.',
                'type': 'weekly_statistics',
                'articles_this_week': articles_this_week,
                'approved_this_week': approved_this_week,
                'rejected_this_week': rejected_this_week,
                'pending_count': pending_count,
                'created_at': datetime.utcnow()
            }

            # Send to all admins
            results = await self.send_bulk_notification_to_admins(notification_data)

            logger.info(f"Weekly statistics sent: {results['successful']}/{results['total_admins']} admins notified")
            return results['successful'] > 0

        except Exception as e:
            logger.error(f"Error sending weekly statistics: {str(e)}")
            return False


# Global service instance
article_notification_service = ArticleNotificationService()


# Helper function to trigger notifications from other parts of the app
async def trigger_article_notification(event_type: str, article: Article, **kwargs):
    """
    Trigger article notification based on event type

    Args:
        event_type: Type of event ('submitted', 'approved', 'rejected', 'featured')
        article: Article object
        **kwargs: Additional parameters
    """
    try:
        if event_type == 'submitted':
            await article_notification_service.notify_admins_new_article(article)

        elif event_type == 'approved':
            admin_id = kwargs.get('admin_id')
            if admin_id:
                await article_notification_service.notify_author_article_approved(article, admin_id)

        elif event_type == 'rejected':
            admin_id = kwargs.get('admin_id')
            reason = kwargs.get('reason', 'No reason provided')
            if admin_id:
                await article_notification_service.notify_author_article_rejected(article, admin_id, reason)

        elif event_type == 'featured':
            admin_id = kwargs.get('admin_id')
            if admin_id:
                await article_notification_service.notify_author_article_featured(article, admin_id)

        else:
            logger.warning(f"Unknown notification event type: {event_type}")

    except Exception as e:
        logger.error(f"Error triggering article notification: {str(e)}")


# Scheduler functions (to be called by a task scheduler like Celery)
async def send_daily_pending_summary_task():
    """Task to send daily pending summary"""
    await article_notification_service.send_daily_pending_summary()


async def send_weekly_statistics_task():
    """Task to send weekly statistics"""
    await article_notification_service.send_weekly_statistics_task()