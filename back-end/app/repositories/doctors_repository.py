from sqlalchemy import func, desc, asc
from app.extensions import db
from app.repositories.base_repository import BaseRepository
from app.models.doctors_model import Doctor
from app.models.users_model import User
from app.models.doctor_specializations_model import DoctorSpecialization
from app.models.doctor_follows_model import DoctorFollow


class DoctorsRepository(BaseRepository):
    def __init__(self):
        super().__init__(Doctor)

    def get_verified_doctors(self, 
                           search_term=None, 
                           clinic_name=None, 
                           clinic_address=None, 
                           specialty=None,
                           sort_by="rating", 
                           sort_order="desc",
                           page=1, 
                           per_page=10):
        """
        Lấy danh sách bác sĩ đã được xác minh với các tính năng tìm kiếm, lọc và sắp xếp
        
        Args:
            search_term (str): Tìm kiếm theo tên đầy đủ của bác sĩ
            clinic_name (str): Lọc theo tên phòng khám
            clinic_address (str): Lọc theo địa chỉ phòng khám
            specialty (str): Lọc theo chuyên khoa từ bảng doctor_specializations
            sort_by (str): Sắp xếp theo ('rating', 'followers', 'experience')
            sort_order (str): Thứ tự sắp xếp ('asc', 'desc')
            page (int): Trang hiện tại
            per_page (int): Số lượng bản ghi mỗi trang
        
        Returns:
            dict: Danh sách bác sĩ và thông tin phân trang
        """
        # Tạo truy vấn cơ bản với join User và đếm số followers
        query = db.session.query(
            Doctor,
            User.full_name,
            func.count(DoctorFollow.follow_id).label('followers_count')
        ).join(
            User, Doctor.user_id == User.user_id
        ).outerjoin(
            DoctorFollow, 
            (Doctor.doctor_id == DoctorFollow.doctor_id) & 
            (DoctorFollow.is_active == True)
        ).filter(
            Doctor.verified == True  # Chỉ lấy bác sĩ đã xác minh
        ).group_by(
            Doctor.doctor_id, User.full_name
        )

        # Tìm kiếm theo tên đầy đủ
        if search_term:
            query = query.filter(
                User.full_name.ilike(f"%{search_term}%")
            )

        # Lọc theo tên phòng khám
        if clinic_name:
            query = query.filter(
                Doctor.clinic_name.ilike(f"%{clinic_name}%")
            )

        # Lọc theo địa chỉ phòng khám
        if clinic_address:
            query = query.filter(
                Doctor.clinic_address.ilike(f"%{clinic_address}%")
            )

        # Lọc theo chuyên khoa
        if specialty:
            query = query.join(
                DoctorSpecialization,
                Doctor.doctor_id == DoctorSpecialization.doctor_id
            ).filter(
                DoctorSpecialization.specialization.ilike(f"%{specialty}%")
            )

        # Sắp xếp
        if sort_by == "rating":
            # Sắp xếp theo rating (xử lý NULL values)
            if sort_order == "desc":
                query = query.order_by(desc(Doctor.rating.nullslast()))
            else:
                query = query.order_by(asc(Doctor.rating.nullsfirst()))
        
        elif sort_by == "followers":
            # Sắp xếp theo số followers
            if sort_order == "desc":
                query = query.order_by(desc('followers_count'))
            else:
                query = query.order_by(asc('followers_count'))
        
        elif sort_by == "experience":
            # Sắp xếp theo kinh nghiệm
            if sort_order == "desc":
                query = query.order_by(desc(Doctor.years_experience.nullslast()))
            else:
                query = query.order_by(asc(Doctor.years_experience.nullsfirst()))

        # Thực hiện phân trang
        paginated_result = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )

        # Xử lý kết quả
        doctors_data = []
        for doctor, full_name, followers_count in paginated_result.items:
            doctor_dict = doctor.to_dict()
            doctor_dict['full_name'] = full_name
            doctor_dict['followers_count'] = followers_count
            
            # Lấy danh sách chuyên khoa của bác sĩ
            specializations = self.get_doctor_specializations(doctor.doctor_id)
            doctor_dict['specializations'] = specializations
            
            doctors_data.append(doctor_dict)

        return {
            'doctors': doctors_data,
            'pagination': {
                'page': paginated_result.page,
                'pages': paginated_result.pages,
                'per_page': paginated_result.per_page,
                'total': paginated_result.total,
                'has_next': paginated_result.has_next,
                'has_prev': paginated_result.has_prev
            }
        }

    def get_doctor_specializations(self, doctor_id):
        """
        Lấy danh sách chuyên khoa của một bác sĩ
        
        Args:
            doctor_id (int): ID của bác sĩ
        
        Returns:
            list: Danh sách chuyên khoa
        """
        specializations = db.session.query(
            DoctorSpecialization.specialization,
            DoctorSpecialization.is_primary
        ).filter(
            DoctorSpecialization.doctor_id == doctor_id
        ).all()
        
        return [
            {
                'specialization': spec.specialization,
                'is_primary': spec.is_primary
            }
            for spec in specializations
        ]

    def get_doctor_with_details(self, doctor_id):
        """
        Lấy thông tin chi tiết của một bác sĩ bao gồm thông tin user và chuyên khoa
        
        Args:
            doctor_id (int): ID của bác sĩ
        
        Returns:
            dict: Thông tin chi tiết bác sĩ
        """
        result = db.session.query(
            Doctor,
            User.full_name,
            User.email,
            User.phone,
            User.avatar_url,
            func.count(DoctorFollow.follow_id).label('followers_count')
        ).join(
            User, Doctor.user_id == User.user_id
        ).outerjoin(
            DoctorFollow,
            (Doctor.doctor_id == DoctorFollow.doctor_id) & 
            (DoctorFollow.is_active == True)
        ).filter(
            Doctor.doctor_id == doctor_id,
            Doctor.verified == True
        ).group_by(
            Doctor.doctor_id,
            User.full_name,
            User.email,
            User.phone,
            User.avatar_url
        ).first()

        if not result:
            return None

        doctor, full_name, email, phone, avatar_url, followers_count = result
        
        doctor_dict = doctor.to_dict()
        doctor_dict.update({
            'full_name': full_name,
            'email': email,
            'phone': phone,
            'avatar_url': avatar_url,
            'followers_count': followers_count,
            'specializations': self.get_doctor_specializations(doctor_id)
        })

        return doctor_dict

    def get_all_specializations(self):
        """
        Lấy danh sách tất cả chuyên khoa có sẵn
        
        Returns:
            list: Danh sách chuyên khoa duy nhất
        """
        specializations = db.session.query(
            DoctorSpecialization.specialization
        ).distinct().all()
        
        return [spec.specialization for spec in specializations]

    def search_doctors_by_specialty(self, specialty, limit=10):
        """
        Tìm kiếm bác sĩ theo chuyên khoa cụ thể
        
        Args:
            specialty (str): Chuyên khoa cần tìm
            limit (int): Giới hạn số lượng kết quả
        
        Returns:
            list: Danh sách bác sĩ có chuyên khoa phù hợp
        """
        doctors = db.session.query(
            Doctor,
            User.full_name,
            DoctorSpecialization.specialization,
            DoctorSpecialization.is_primary
        ).join(
            User, Doctor.user_id == User.user_id
        ).join(
            DoctorSpecialization,
            Doctor.doctor_id == DoctorSpecialization.doctor_id
        ).filter(
            Doctor.verified == True,
            DoctorSpecialization.specialization.ilike(f"%{specialty}%")
        ).limit(limit).all()

        results = []
        for doctor, full_name, specialization, is_primary in doctors:
            doctor_dict = doctor.to_dict()
            doctor_dict['full_name'] = full_name
            doctor_dict['matched_specialization'] = specialization
            doctor_dict['is_primary_specialization'] = is_primary
            results.append(doctor_dict)

        return results

    def get_top_rated_doctors(self, limit=10):
        """
        Lấy danh sách bác sĩ có rating cao nhất
        
        Args:
            limit (int): Số lượng bác sĩ cần lấy
        
        Returns:
            list: Danh sách bác sĩ có rating cao nhất
        """
        doctors = db.session.query(
            Doctor,
            User.full_name
        ).join(
            User, Doctor.user_id == User.user_id
        ).filter(
            Doctor.verified == True,
            Doctor.rating.isnot(None)
        ).order_by(
            desc(Doctor.rating)
        ).limit(limit).all()

        results = []
        for doctor, full_name in doctors:
            doctor_dict = doctor.to_dict()
            doctor_dict['full_name'] = full_name
            doctor_dict['specializations'] = self.get_doctor_specializations(doctor.doctor_id)
            results.append(doctor_dict)

        return results

    def get_most_followed_doctors(self, limit=10):
        """
        Lấy danh sách bác sĩ có nhiều followers nhất
        
        Args:
            limit (int): Số lượng bác sĩ cần lấy
        
        Returns:
            list: Danh sách bác sĩ có nhiều followers nhất
        """
        doctors = db.session.query(
            Doctor,
            User.full_name,
            func.count(DoctorFollow.follow_id).label('followers_count')
        ).join(
            User, Doctor.user_id == User.user_id
        ).join(
            DoctorFollow,
            (Doctor.doctor_id == DoctorFollow.doctor_id) & 
            (DoctorFollow.is_active == True)
        ).filter(
            Doctor.verified == True
        ).group_by(
            Doctor.doctor_id,
            User.full_name
        ).order_by(
            desc('followers_count')
        ).limit(limit).all()

        results = []
        for doctor, full_name, followers_count in doctors:
            doctor_dict = doctor.to_dict()
            doctor_dict['full_name'] = full_name
            doctor_dict['followers_count'] = followers_count
            doctor_dict['specializations'] = self.get_doctor_specializations(doctor.doctor_id)
            results.append(doctor_dict)

        return results
