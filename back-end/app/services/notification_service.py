from app.repositories.notification_repository import NotificationRepository
from app.repositories.auth_repository import AuthRepository
from app.models.doctors_model import Doctor
from app.models.parents_model import Parent
from app.models.doctor_follows_model import DoctorFollow
from app.extensions import db

class NotificationService:
    def __init__(self):
        self.notification_repo = NotificationRepository()
        self.auth_repo = AuthRepository()

    def create_follow_notification(self, doctor_id, parent_id):
        """Create notification when parent follows doctor"""
        try:
            # Get doctor and parent info
            doctor = db.session.query(Doctor).filter_by(doctor_id=doctor_id).first()
            parent = db.session.query(Parent).filter_by(parent_id=parent_id).first()
            
            if not doctor or not parent:
                return {'success': False, 'message': 'Doctor or parent not found'}
            
            # Get parent user info
            parent_user = self.auth_repo.get_user_by(user_id=parent.user_id)
            if not parent_user:
                return {'success': False, 'message': 'Parent user not found'}
            
            # Create notification for doctor
            notification = self.notification_repo.create_follow_notification(
                doctor_user_id=doctor.user_id,
                parent_user_id=parent.user_id,
                parent_name=parent_user.full_name
            )
            
            return {'success': True, 'notification': notification.to_dict()}
            
        except Exception as e:
            return {'success': False, 'message': str(e)}

    def create_new_article_notifications(self, article_id, article_title, doctor_user_id):
        """Create notifications for all parents following this doctor when they post new article"""
        try:
            print(f"🔔 Creating notifications for article: {article_id} by doctor: {doctor_user_id}")
            
            # Get doctor info
            doctor = db.session.query(Doctor).filter_by(user_id=doctor_user_id).first()
            if not doctor:
                print(f"❌ Doctor not found for user_id: {doctor_user_id}")
                return {'success': False, 'message': 'Doctor not found'}
            
            print(f"✅ Found doctor: {doctor.doctor_id}")
            
            doctor_user = self.auth_repo.get_user_by(user_id=doctor_user_id)
            if not doctor_user:
                print(f"❌ Doctor user not found for user_id: {doctor_user_id}")
                return {'success': False, 'message': 'Doctor user not found'}
            
            print(f"✅ Found doctor user: {doctor_user.full_name}")
            
            # Get all parents following this doctor
            follows = db.session.query(DoctorFollow).filter_by(
                doctor_id=doctor.doctor_id,
                is_active=True
            ).all()
            
            print(f"👥 Found {len(follows)} active follows for doctor {doctor.doctor_id}")
            
            notifications_created = []
            
            for follow in follows:
                print(f"📧 Creating notification for parent: {follow.parent_id}")
                # Get parent user info
                parent = db.session.query(Parent).filter_by(parent_id=follow.parent_id).first()
                if parent:
                    print(f"✅ Found parent user_id: {parent.user_id}")
                    # Create notification for this parent
                    notification = self.notification_repo.create_new_article_notification(
                        parent_user_id=parent.user_id,
                        doctor_name=doctor_user.full_name,
                        article_title=article_title,
                        article_id=article_id
                    )
                    notifications_created.append(notification.to_dict())
                    print(f"✅ Created notification {notification.notification_id} for parent {parent.user_id}")
                else:
                    print(f"❌ Parent not found for parent_id: {follow.parent_id}")
            
            print(f"🎉 Created {len(notifications_created)} notifications total")
            
            return {
                'success': True, 
                'notifications_created': len(notifications_created),
                'notifications': notifications_created
            }
            
        except Exception as e:
            print(f"❌ Error creating notifications: {str(e)}")
            return {'success': False, 'message': str(e)}

    def get_user_notifications(self, user_id, limit=50, offset=0, unread_only=False):
        """Get notifications for a user"""
        try:
            notifications = self.notification_repo.get_user_notifications(
                user_id=user_id,
                limit=limit,
                offset=offset,
                unread_only=unread_only
            )
            
            return {
                'success': True,
                'notifications': [n.to_dict() for n in notifications],
                'unread_count': self.notification_repo.get_unread_count(user_id)
            }
            
        except Exception as e:
            return {'success': False, 'message': str(e)}

    def mark_notification_as_read(self, notification_id, user_id):
        """Mark a notification as read"""
        try:
            notification = self.notification_repo.mark_as_read(notification_id, user_id)
            if notification:
                return {'success': True, 'notification': notification.to_dict()}
            else:
                return {'success': False, 'message': 'Notification not found'}
                
        except Exception as e:
            return {'success': False, 'message': str(e)}

    def mark_all_as_read(self, user_id):
        """Mark all notifications as read for a user"""
        try:
            count = self.notification_repo.mark_all_as_read(user_id)
            return {'success': True, 'marked_count': count}
            
        except Exception as e:
            return {'success': False, 'message': str(e)}

    def delete_notification(self, notification_id, user_id):
        """Delete a notification"""
        try:
            success = self.notification_repo.delete_notification(notification_id, user_id)
            if success:
                return {'success': True, 'message': 'Notification deleted'}
            else:
                return {'success': False, 'message': 'Notification not found'}
                
        except Exception as e:
            return {'success': False, 'message': str(e)}

    def get_unread_count(self, user_id):
        """Get unread notification count"""
        try:
            count = self.notification_repo.get_unread_count(user_id)
            return {'success': True, 'unread_count': count}
            
        except Exception as e:
            return {'success': False, 'message': str(e)}
