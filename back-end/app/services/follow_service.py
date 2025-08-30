from sqlalchemy.exc import IntegrityError
from app.models.doctor_follows_model import DoctorFollow
from app.models.doctors_model import Doctor
from app.models.parents_model import Parent
from app.extensions import db
from datetime import datetime

class FollowService:
    def __init__(self):
        # Import notification service để tránh circular import
        from app.services.notification_service import NotificationService
        self.notification_service = NotificationService()
    def toggle_follow_doctor(self, parent_id, doctor_id):
        """
        Toggle follow/unfollow doctor
        
        Args:
            parent_id (int): ID của parent
            doctor_id (int): ID của doctor
            
        Returns:
            dict: Kết quả thao tác và trạng thái follow
        """
        try:
            # Kiểm tra doctor có tồn tại và đã được verified
            doctor = db.session.query(Doctor).filter(
                Doctor.doctor_id == doctor_id,
                Doctor.verified == True
            ).first()
            
            if not doctor:
                return {
                    'success': False,
                    'message': 'Bác sĩ không tồn tại hoặc chưa được xác minh'
                }
            
            # Kiểm tra parent có tồn tại
            parent = db.session.query(Parent).filter(
                Parent.parent_id == parent_id
            ).first()
            
            if not parent:
                return {
                    'success': False,
                    'message': 'Người dùng không tồn tại'
                }
            
            # Kiểm tra đã follow chưa
            existing_follow = db.session.query(DoctorFollow).filter(
                DoctorFollow.parent_id == parent_id,
                DoctorFollow.doctor_id == doctor_id
            ).first()
            
            if existing_follow:
                if existing_follow.is_active:
                    # Unfollow
                    existing_follow.is_active = False
                    db.session.commit()
                    
                    return {
                        'success': True,
                        'message': 'Đã hủy theo dõi bác sĩ',
                        'is_following': False,
                        'followers_count': self._get_followers_count(doctor_id)
                    }
                else:
                    # Re-follow
                    existing_follow.is_active = True
                    existing_follow.followed_at = datetime.utcnow()
                    db.session.commit()
                    
                    # Tạo notification cho doctor khi được follow lại
                    try:
                        self.notification_service.create_follow_notification(
                            doctor_id=doctor_id,
                            parent_id=parent_id
                        )
                    except Exception as e:
                        # Log lỗi nhưng không làm fail toàn bộ request
                        print(f"Failed to create follow notification: {str(e)}")
                    
                    return {
                        'success': True,
                        'message': 'Đã theo dõi bác sĩ',
                        'is_following': True,
                        'followers_count': self._get_followers_count(doctor_id)
                    }
            else:
                # Follow mới
                new_follow = DoctorFollow(
                    parent_id=parent_id,
                    doctor_id=doctor_id,
                    followed_at=datetime.utcnow(),
                    is_active=True
                )
                db.session.add(new_follow)
                db.session.commit()
                
                # Tạo notification cho doctor khi có người follow mới
                try:
                    self.notification_service.create_follow_notification(
                        doctor_id=doctor_id,
                        parent_id=parent_id
                    )
                except Exception as e:
                    # Log lỗi nhưng không làm fail toàn bộ request
                    print(f"Failed to create follow notification: {str(e)}")
                
                return {
                    'success': True,
                    'message': 'Đã theo dõi bác sĩ',
                    'is_following': True,
                    'followers_count': self._get_followers_count(doctor_id)
                }
                
        except IntegrityError:
            db.session.rollback()
            return {
                'success': False,
                'message': 'Có lỗi xảy ra khi thực hiện thao tác'
            }
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'message': f'Có lỗi xảy ra: {str(e)}'
            }
    
    def check_follow_status(self, parent_id, doctor_id):
        """
        Kiểm tra trạng thái follow của parent với doctor
        
        Args:
            parent_id (int): ID của parent
            doctor_id (int): ID của doctor
            
        Returns:
            dict: Trạng thái follow
        """
        try:
            follow = db.session.query(DoctorFollow).filter(
                DoctorFollow.parent_id == parent_id,
                DoctorFollow.doctor_id == doctor_id,
                DoctorFollow.is_active == True
            ).first()
            
            return {
                'success': True,
                'is_following': follow is not None,
                'followed_at': follow.followed_at.isoformat() if follow else None
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'Có lỗi xảy ra: {str(e)}'
            }
    
    def get_followed_doctors(self, parent_id, page=1, per_page=10):
        """
        Lấy danh sách bác sĩ mà parent đang theo dõi
        
        Args:
            parent_id (int): ID của parent
            page (int): Trang hiện tại
            per_page (int): Số lượng mỗi trang
            
        Returns:
            dict: Danh sách bác sĩ đang theo dõi
        """
        try:
            from app.models.users_model import User
            from sqlalchemy import func
            
            # Query để lấy danh sách bác sĩ đang follow
            query = db.session.query(
                Doctor,
                User,
                DoctorFollow.followed_at
            ).join(
                User, Doctor.user_id == User.user_id
            ).join(
                DoctorFollow, Doctor.doctor_id == DoctorFollow.doctor_id
            ).filter(
                DoctorFollow.parent_id == parent_id,
                DoctorFollow.is_active == True
            ).order_by(
                DoctorFollow.followed_at.desc()
            )
            
            # Pagination
            offset = (page - 1) * per_page
            total_count = query.count()
            results = query.offset(offset).limit(per_page).all()
            
            # Format response
            doctors = []
            for doctor, user, followed_at in results:
                # Get specializations
                from app.models.doctor_specializations_model import DoctorSpecialization
                specializations = db.session.query(DoctorSpecialization).filter(
                    DoctorSpecialization.doctor_id == doctor.doctor_id
                ).all()
                
                doctor_data = {
                    'doctor_id': doctor.doctor_id,
                    'user_id': doctor.user_id,
                    'license_number': doctor.license_number,
                    'specialty': doctor.specialty,
                    'years_experience': doctor.years_experience,
                    'bio': doctor.bio,
                    'clinic_name': doctor.clinic_name,
                    'clinic_address': doctor.clinic_address,
                    'verified': doctor.verified,
                    'verification_date': doctor.verification_date.isoformat() if doctor.verification_date else None,
                    'rating': float(doctor.rating) if doctor.rating else 0.0,
                    'total_reviews': doctor.total_reviews or 0,
                    'role_id': doctor.role_id,
                    'full_name': user.full_name,
                    'email': user.email,
                    'phone': user.phone,
                    'avatar_url': user.avatar_url,
                    'followers_count': self._get_followers_count(doctor.doctor_id),
                    'followed_at': followed_at.isoformat() if followed_at else None,
                    'specializations': [
                        {
                            'specialization': spec.specialization,
                            'is_primary': spec.is_primary
                        } for spec in specializations
                    ],
                    'primary_specialty': next(
                        (spec.specialization for spec in specializations if spec.is_primary),
                        doctor.specialty
                    )
                }
                doctors.append(doctor_data)
            
            # Pagination info
            total_pages = (total_count + per_page - 1) // per_page
            pagination = {
                'page': page,
                'pages': total_pages,
                'per_page': per_page,
                'total': total_count,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
            
            return {
                'success': True,
                'data': {
                    'doctors': doctors,
                    'pagination': pagination
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'Có lỗi xảy ra: {str(e)}'
            }
    
    def get_followers_list(self, doctor_id, page=1, per_page=10):
        """
        Lấy danh sách followers của một bác sĩ
        
        Args:
            doctor_id (int): ID của doctor
            page (int): Trang hiện tại
            per_page (int): Số lượng mỗi trang
            
        Returns:
            dict: Danh sách followers
        """
        try:
            from app.models.users_model import User
            
            # Query để lấy danh sách followers
            query = db.session.query(
                Parent,
                User,
                DoctorFollow.followed_at
            ).join(
                User, Parent.user_id == User.user_id
            ).join(
                DoctorFollow, Parent.parent_id == DoctorFollow.parent_id
            ).filter(
                DoctorFollow.doctor_id == doctor_id,
                DoctorFollow.is_active == True
            ).order_by(
                DoctorFollow.followed_at.desc()
            )
            
            # Pagination
            offset = (page - 1) * per_page
            total_count = query.count()
            results = query.offset(offset).limit(per_page).all()
            
            # Format response
            followers = []
            for parent, user, followed_at in results:
                follower_data = {
                    'parent_id': parent.parent_id,
                    'user_id': parent.user_id,
                    'full_name': user.full_name,
                    'avatar_url': user.avatar_url,
                    'followed_at': followed_at.isoformat() if followed_at else None
                }
                followers.append(follower_data)
            
            # Pagination info
            total_pages = (total_count + per_page - 1) // per_page
            pagination = {
                'page': page,
                'pages': total_pages,
                'per_page': per_page,
                'total': total_count,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
            
            return {
                'success': True,
                'data': {
                    'followers': followers,
                    'pagination': pagination
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'Có lỗi xảy ra: {str(e)}'
            }
    
    def _get_followers_count(self, doctor_id):
        """
        Đếm số lượng followers của một bác sĩ
        
        Args:
            doctor_id (int): ID của doctor
            
        Returns:
            int: Số lượng followers
        """
        try:
            return db.session.query(DoctorFollow).filter(
                DoctorFollow.doctor_id == doctor_id,
                DoctorFollow.is_active == True
            ).count()
        except:
            return 0