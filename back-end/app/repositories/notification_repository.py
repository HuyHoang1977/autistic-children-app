from app.models.notifications_model import Notification
from .base_repository import BaseRepository
from app.extensions import db
from datetime import datetime
import json

class NotificationRepository(BaseRepository):
    def __init__(self):
        super().__init__(Notification)

    def create_notification(self, user_id, title, message, notification_type=1, metadata=None):
        """Create a new notification"""
        notification_data = {
            'user_id': user_id,
            'title': title,
            'message': message,
            'notification_type': notification_type,
            'is_read': False,
            'created_at': datetime.utcnow()
        }
        
        if metadata:
            notification_data['notification_metadata'] = json.dumps(metadata)
        
        return self.create(**notification_data)

    def get_user_notifications(self, user_id, limit=50, offset=0, unread_only=False):
        """Get notifications for a user"""
        query = db.session.query(Notification).filter_by(user_id=user_id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        return query.order_by(Notification.created_at.desc()).limit(limit).offset(offset).all()

    def mark_as_read(self, notification_id, user_id):
        """Mark a notification as read"""
        notification = db.session.query(Notification).filter_by(
            notification_id=notification_id,
            user_id=user_id
        ).first()
        
        if notification:
            notification.is_read = True
            db.session.commit()
            return notification
        return None

    def mark_all_as_read(self, user_id):
        """Mark all notifications as read for a user"""
        notifications = db.session.query(Notification).filter_by(
            user_id=user_id,
            is_read=False
        ).all()
        
        for notification in notifications:
            notification.is_read = True
        
        db.session.commit()
        return len(notifications)

    def get_unread_count(self, user_id):
        """Get unread notification count for a user"""
        return db.session.query(Notification).filter_by(
            user_id=user_id,
            is_read=False
        ).count()

    def delete_notification(self, notification_id, user_id):
        """Delete a notification"""
        notification = db.session.query(Notification).filter_by(
            notification_id=notification_id,
            user_id=user_id
        ).first()
        
        if notification:
            db.session.delete(notification)
            db.session.commit()
            return True
        return False

    def create_follow_notification(self, doctor_user_id, parent_user_id, parent_name):
        """Create notification when someone follows a doctor"""
        return self.create_notification(
            user_id=doctor_user_id,
            title="Có người theo dõi mới",
            message=f"{parent_name} đã theo dõi bạn",
            notification_type=3,  # success type
            metadata={
                'type': 'follow',
                'follower_id': parent_user_id,
                'follower_name': parent_name
            }
        )

    def create_new_article_notification(self, parent_user_id, doctor_name, article_title, article_id):
        """Create notification when a followed doctor posts new article"""
        return self.create_notification(
            user_id=parent_user_id,
            title="Bài viết mới",
            message=f"Bác sĩ {doctor_name} đã đăng bài viết mới: {article_title}",
            notification_type=1,  # info type
            metadata={
                'type': 'new_article',
                'article_id': article_id,
                'article_title': article_title,
                'doctor_name': doctor_name
            }
        )

    def get_notifications_by_type(self, user_id, notification_type):
        """Get notifications by type"""
        return db.session.query(Notification).filter_by(
            user_id=user_id,
            notification_type=notification_type
        ).order_by(Notification.created_at.desc()).all()
