from app.repositories.profile_repository import ProfileRepository
from app.validations.auth_validation import ROLE_PARENT, ROLE_DOCTOR
from app.services.minio_service import minio_service
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ProfileService:
    def __init__(self):
        self.repo = ProfileRepository()

    def get_profile(self, user_id):
        user = self.repo.get_user_by_id(user_id)
        if not user:
            return None, "User not found"
        data = user.to_dict()
        if getattr(user, "role_id", None) == ROLE_PARENT:
            parent = self.repo.get_parent_by_user_id(user_id)
            if parent:
                data["parent_info"] = parent.to_dict()
                childs = self.repo.get_childs_by_parent_id(parent.parent_id)
                data["children"] = [c.to_dict() for c in childs]
        elif getattr(user, "role_id", None) == ROLE_DOCTOR:
            doctor = self.repo.get_doctor_by_user_id(user_id)
            if doctor:
                data["doctor_info"] = doctor.to_dict()
        return data, None

    def update_profile(self, user_id, user_data, role_data):
        user = self.repo.update_user(user_id, **user_data)
        if not user:
            return None, "User not found"
        if getattr(user, "role_id", None) == ROLE_PARENT:
            parent = self.repo.update_parent(user_id, **role_data)
            return parent, None if parent else (None, "Parent not found")
        elif getattr(user, "role_id", None) == ROLE_DOCTOR:
            doctor = self.repo.update_doctor(user_id, **role_data)
            return doctor, None if doctor else (None, "Doctor not found")
        return user, None

    # Child methods
    def add_child(self, user_id, child_data):
        parent = self.repo.get_parent_by_user_id(user_id)
        if not parent:
            return None, "Parent not found"
        # Chuyển birth_date từ string sang datetime.date nếu cần
        if isinstance(child_data.get("birth_date"), str):
            child_data["birth_date"] = datetime.fromisoformat(child_data["birth_date"]).date()
        child = self.repo.add_child(parent.parent_id, **child_data)
        
        # Tự động cập nhật số con
        if child:
            self._update_parent_children_count(parent.parent_id)
        
        return child, None

    def update_child(self, child_id, child_data):
        if "birth_date" in child_data and isinstance(child_data["birth_date"], str):
            child_data["birth_date"] = datetime.fromisoformat(child_data["birth_date"]).date()
        child = self.repo.update_child(child_id, **child_data)
        return child, None if child else (None, "Child not found")

    def delete_child(self, child_id):
        # Lấy thông tin child để biết parent_id trước khi xóa
        child = self.repo.get_child_by_id(child_id)
        if not child:
            return False
        
        parent_id = child.parent_id
        success = self.repo.delete_child(child_id)
        
        # Tự động cập nhật số con sau khi xóa
        if success:
            self._update_parent_children_count(parent_id)
        
        return success
    
    def _update_parent_children_count(self, parent_id):
        """Tự động cập nhật số con dựa trên số trẻ thực tế trong database"""
        childs = self.repo.get_childs_by_parent_id(parent_id)
        actual_count = len(childs)
        parent = self.repo.get_parent_by_id(parent_id)
        if parent:
            self.repo.update_parent_by_id(parent_id, number_of_children=actual_count)

    # Avatar management methods
    def upload_avatar(self, user_id, file):
        """Upload avatar cho user"""
        try:
            logger.info(f"📸 Uploading avatar for user_id: {user_id}")
            
            # Get current user để lấy avatar cũ (nếu có)
            user = self.repo.get_user_by_id(user_id)
            if not user:
                return None, "User not found"
            
            # Upload file mới vào bucket avatars
            upload_result = minio_service.upload_file(
                file=file,
                bucket_type='avatars',
                folder=f'user_{user_id}'
            )
            
            if not upload_result['success']:
                logger.error(f"❌ Avatar upload failed: {upload_result.get('error')}")
                return None, upload_result.get('error', 'Upload failed')
            
            # Xóa avatar cũ nếu có
            old_avatar_url = user.avatar_url
            if old_avatar_url:
                delete_result = minio_service.delete_file_by_url(old_avatar_url)
                if not delete_result['success']:
                    logger.warning(f"⚠️ Failed to delete old avatar: {old_avatar_url}")
            
            # Cập nhật avatar_url trong database
            updated_user = self.repo.update_user(user_id, avatar_url=upload_result['file_url'])
            
            if updated_user:
                logger.info(f"✅ Avatar uploaded successfully: {upload_result['file_url']}")
                return {
                    'avatar_url': upload_result['file_url'],
                    'file_size': upload_result['file_size'],
                    'content_type': upload_result['content_type']
                }, None
            else:
                return None, "Failed to update user avatar URL"
                
        except Exception as e:
            logger.error(f"❌ Avatar upload error: {e}", exc_info=True)
            return None, f"Avatar upload failed: {str(e)}"
    
    def delete_avatar(self, user_id):
        """Xóa avatar của user"""
        try:
            logger.info(f"🗑️ Deleting avatar for user_id: {user_id}")
            
            user = self.repo.get_user_by_id(user_id)
            if not user:
                return False, "User not found"
            
            if not user.avatar_url:
                return False, "User has no avatar to delete"
            
            # Xóa file từ MinIO
            delete_result = minio_service.delete_file_by_url(user.avatar_url)
            if not delete_result['success']:
                logger.warning(f"⚠️ Failed to delete avatar file: {user.avatar_url}")
            
            # Cập nhật database để xóa avatar_url
            updated_user = self.repo.update_user(user_id, avatar_url=None)
            
            if updated_user:
                logger.info(f"✅ Avatar deleted successfully")
                return True, None
            else:
                return False, "Failed to update user avatar URL"
                
        except Exception as e:
            logger.error(f"❌ Avatar delete error: {e}", exc_info=True)
            return False, f"Avatar delete failed: {str(e)}"
    
    def update_avatar(self, user_id, file):
        """Cập nhật avatar (xóa cũ và upload mới)"""
        try:
            logger.info(f"🔄 Updating avatar for user_id: {user_id}")
            
            user = self.repo.get_user_by_id(user_id)
            if not user:
                return None, "User not found"
            
            # Sử dụng update_file của minio_service để xử lý việc update
            old_avatar_url = user.avatar_url
            
            upload_result = minio_service.update_file(
                old_file_url=old_avatar_url,
                new_file=file,
                bucket_type='avatars',
                folder=f'user_{user_id}'
            )
            
            if not upload_result['success']:
                logger.error(f"❌ Avatar update failed: {upload_result.get('error')}")
                return None, upload_result.get('error', 'Update failed')
            
            # Cập nhật avatar_url trong database
            updated_user = self.repo.update_user(user_id, avatar_url=upload_result['file_url'])
            
            if updated_user:
                logger.info(f"✅ Avatar updated successfully: {upload_result['file_url']}")
                return {
                    'avatar_url': upload_result['file_url'],
                    'file_size': upload_result['file_size'],
                    'content_type': upload_result['content_type']
                }, None
            else:
                return None, "Failed to update user avatar URL"
                
        except Exception as e:
            logger.error(f"❌ Avatar update error: {e}", exc_info=True)
            return None, f"Avatar update failed: {str(e)}"