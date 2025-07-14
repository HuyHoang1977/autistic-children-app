from sqlalchemy import func, desc, asc, text
from sqlalchemy.orm import joinedload
from app.models import Doctor, User, DoctorFollow, DoctorSpecialization
from app.extensions import db

class DoctorsService:
    def get_verified_doctors_list(self, search_term=None, clinic_name=None, 
                                 clinic_address=None, specialty=None, 
                                 sort_by='rating', sort_order='desc', 
                                 page=1, per_page=10):
        """
        Lấy danh sách bác sĩ đã xác minh với filter và pagination
        """
        try:
            # Base query với join - FIX: Include all columns in GROUP BY
            query = db.session.query(
                Doctor,
                User,
                func.count(DoctorFollow.follow_id).label('followers_count')
            )\
                .join(User, Doctor.user_id == User.user_id)\
                .outerjoin(DoctorFollow, (Doctor.doctor_id == DoctorFollow.doctor_id) & (DoctorFollow.is_active == True))\
                .filter(Doctor.verified == True)
            
            # Apply filters
            if search_term:
                query = query.filter(User.full_name.ilike(f'%{search_term}%'))
            
            if clinic_name:
                query = query.filter(Doctor.clinic_name.ilike(f'%{clinic_name}%'))
            
            if clinic_address:
                query = query.filter(Doctor.clinic_address.ilike(f'%{clinic_address}%'))
            
            if specialty:
                query = query.filter(Doctor.specialty.ilike(f'%{specialty}%'))
            
            # Group by all columns from both models
            query = query.group_by(Doctor, User)
            
            # Apply sorting with text() for NULLS handling
            if sort_by == 'rating':
                if sort_order == 'desc':
                    query = query.order_by(text('doctors.rating DESC NULLS LAST'))
                else:
                    query = query.order_by(text('doctors.rating ASC NULLS FIRST'))
            elif sort_by == 'followers':
                if sort_order == 'desc':
                    query = query.order_by(desc(func.count(DoctorFollow.follow_id)))
                else:
                    query = query.order_by(asc(func.count(DoctorFollow.follow_id)))
            elif sort_by == 'experience':
                if sort_order == 'desc':
                    query = query.order_by(text('doctors.years_experience DESC NULLS LAST'))
                else:
                    query = query.order_by(text('doctors.years_experience ASC NULLS FIRST'))
            else:
                # Default sort by rating desc
                query = query.order_by(text('doctors.rating DESC NULLS LAST'))
            
            # Pagination
            offset = (page - 1) * per_page
            total_count = query.count()
            results = query.offset(offset).limit(per_page).all()
            
            # Format response
            doctors = []
            for doctor, user, followers_count in results:
                # Get specializations
                specializations = db.session.query(DoctorSpecialization)\
                    .filter(DoctorSpecialization.doctor_id == doctor.doctor_id)\
                    .all()
                
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
                    'followers_count': followers_count or 0,
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
                'doctors': doctors,
                'pagination': pagination
            }
            
        except Exception as e:
            print(f"Error in get_verified_doctors_list: {str(e)}")
            raise e
    
    def get_doctor_details(self, doctor_id):
        """
        Lấy thông tin chi tiết của một bác sĩ
        """
        try:
            result = db.session.query(
                Doctor,
                User,
                func.count(DoctorFollow.follow_id).label('followers_count')
            )\
                .join(User, Doctor.user_id == User.user_id)\
                .outerjoin(DoctorFollow, (Doctor.doctor_id == DoctorFollow.doctor_id) & (DoctorFollow.is_active == True))\
                .filter(Doctor.doctor_id == doctor_id, Doctor.verified == True)\
                .group_by(Doctor, User)\
                .first()
            
            if not result:
                return None
            
            doctor, user, followers_count = result
            
            # Get specializations
            specializations = db.session.query(DoctorSpecialization)\
                .filter(DoctorSpecialization.doctor_id == doctor.doctor_id)\
                .all()
            
            return {
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
                'followers_count': followers_count or 0,
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
            
        except Exception as e:
            print(f"Error in get_doctor_details: {str(e)}")
            raise e
    
    def search_doctors_by_specialty(self, specialty, limit=10):
        """
        Tìm kiếm bác sĩ theo chuyên khoa
        """
        try:
            results = db.session.query(
                Doctor,
                User,
                func.count(DoctorFollow.follow_id).label('followers_count')
            )\
                .join(User, Doctor.user_id == User.user_id)\
                .outerjoin(DoctorFollow, (Doctor.doctor_id == DoctorFollow.doctor_id) & (DoctorFollow.is_active == True))\
                .filter(Doctor.verified == True)\
                .filter(Doctor.specialty.ilike(f'%{specialty}%'))\
                .group_by(Doctor, User)\
                .order_by(text('doctors.rating DESC NULLS LAST'))\
                .limit(limit)\
                .all()
            
            doctors = []
            for doctor, user, followers_count in results:
                specializations = db.session.query(DoctorSpecialization)\
                    .filter(DoctorSpecialization.doctor_id == doctor.doctor_id)\
                    .all()
                
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
                    'followers_count': followers_count or 0,
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
            
            return doctors
            
        except Exception as e:
            print(f"Error in search_doctors_by_specialty: {str(e)}")
            raise e
    
    def get_top_rated_doctors(self, limit=10):
        """
        Lấy danh sách bác sĩ có rating cao nhất
        """
        try:
            results = db.session.query(
                Doctor,
                User,
                func.count(DoctorFollow.follow_id).label('followers_count')
            )\
                .join(User, Doctor.user_id == User.user_id)\
                .outerjoin(DoctorFollow, (Doctor.doctor_id == DoctorFollow.doctor_id) & (DoctorFollow.is_active == True))\
                .filter(Doctor.verified == True)\
                .filter(Doctor.rating.isnot(None))\
                .group_by(Doctor, User)\
                .order_by(desc(Doctor.rating))\
                .limit(limit)\
                .all()
            
            doctors = []
            for doctor, user, followers_count in results:
                specializations = db.session.query(DoctorSpecialization)\
                    .filter(DoctorSpecialization.doctor_id == doctor.doctor_id)\
                    .all()
                
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
                    'followers_count': followers_count or 0,
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
            
            return doctors
            
        except Exception as e:
            print(f"Error in get_top_rated_doctors: {str(e)}")
            raise e
    
    def get_most_followed_doctors(self, limit=10):
        """
        Lấy danh sách bác sĩ có nhiều followers nhất
        """
        try:
            results = db.session.query(
                Doctor,
                User,
                func.count(DoctorFollow.follow_id).label('followers_count')
            )\
                .join(User, Doctor.user_id == User.user_id)\
                .outerjoin(DoctorFollow, (Doctor.doctor_id == DoctorFollow.doctor_id) & (DoctorFollow.is_active == True))\
                .filter(Doctor.verified == True)\
                .group_by(Doctor, User)\
                .order_by(desc(func.count(DoctorFollow.follow_id)))\
                .limit(limit)\
                .all()
            
            doctors = []
            for doctor, user, followers_count in results:
                specializations = db.session.query(DoctorSpecialization)\
                    .filter(DoctorSpecialization.doctor_id == doctor.doctor_id)\
                    .all()
                
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
                    'followers_count': followers_count or 0,
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
            
            return doctors
            
        except Exception as e:
            print(f"Error in get_most_followed_doctors: {str(e)}")
            raise e
    
    def get_all_specializations(self):
        """
        Lấy danh sách tất cả chuyên khoa
        """
        try:
            specializations = db.session.query(DoctorSpecialization.specialization)\
                .distinct()\
                .order_by(DoctorSpecialization.specialization)\
                .all()
            
            return [spec[0] for spec in specializations]
            
        except Exception as e:
            print(f"Error in get_all_specializations: {str(e)}")
            raise e
    
    def get_doctors_statistics(self):
        """
        Lấy thống kê tổng quan về bác sĩ
        """
        try:
            # Tổng số bác sĩ đã xác minh
            total_verified = db.session.query(Doctor).filter(Doctor.verified == True).count()
            
            # Tổng số chuyên khoa
            total_specializations = db.session.query(DoctorSpecialization.specialization)\
                .distinct().count()
            
            # Bác sĩ rating cao nhất
            top_rated = db.session.query(Doctor, User)\
                .join(User, Doctor.user_id == User.user_id)\
                .filter(Doctor.verified == True)\
                .filter(Doctor.rating.isnot(None))\
                .order_by(desc(Doctor.rating))\
                .limit(5)\
                .all()
            
            # Bác sĩ có nhiều followers nhất - FIX: Group by both models
            most_followed = db.session.query(
                Doctor,
                User,
                func.count(DoctorFollow.follow_id).label('followers_count')
            )\
                .join(User, Doctor.user_id == User.user_id)\
                .outerjoin(DoctorFollow, (Doctor.doctor_id == DoctorFollow.doctor_id) & (DoctorFollow.is_active == True))\
                .filter(Doctor.verified == True)\
                .group_by(Doctor, User)\
                .order_by(desc(func.count(DoctorFollow.follow_id)))\
                .limit(5)\
                .all()
            
            return {
                'total_verified_doctors': total_verified,
                'total_specializations': total_specializations,
                'top_rated_doctors': [
                    {
                        'doctor_id': doctor.doctor_id,
                        'full_name': user.full_name,
                        'rating': float(doctor.rating) if doctor.rating else 0.0,
                        'total_reviews': doctor.total_reviews or 0,
                        'specialty': doctor.specialty
                    } for doctor, user in top_rated
                ],
                'most_followed_doctors': [
                    {
                        'doctor_id': doctor.doctor_id,
                        'full_name': user.full_name,
                        'followers_count': followers_count or 0,
                        'specialty': doctor.specialty
                    } for doctor, user, followers_count in most_followed
                ]
            }
            
        except Exception as e:
            print(f"Error in get_doctors_statistics: {str(e)}")
            raise e