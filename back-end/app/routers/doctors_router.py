from flask import Blueprint, request, jsonify
from app.services.doctors_service import DoctorsService

# Tạo blueprint với strict_slashes=False để tránh redirect
doctors_bp = Blueprint('doctors', __name__)
doctors_service = DoctorsService()


@doctors_bp.route('', methods=['GET'])  # Không có trailing slash
@doctors_bp.route('/', methods=['GET'])  # Có trailing slash
def get_doctors():
    """
    Lấy danh sách bác sĩ đã xác minh
    Query parameters:
    - search_term: tìm kiếm theo tên
    - clinic_name: lọc theo tên phòng khám
    - clinic_address: lọc theo địa chỉ phòng khám
    - specialty: lọc theo chuyên khoa
    - sort_by: sắp xếp theo (rating, followers, experience)
    - sort_order: thứ tự (asc, desc)
    - page: trang hiện tại
    - per_page: số lượng mỗi trang
    """
    try:
        # Lấy parameters từ query string
        search_term = request.args.get('search_term')
        clinic_name = request.args.get('clinic_name')
        clinic_address = request.args.get('clinic_address')
        specialty = request.args.get('specialty')
        sort_by = request.args.get('sort_by', 'rating')
        sort_order = request.args.get('sort_order', 'desc')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Gọi service để lấy dữ liệu
        result = doctors_service.get_verified_doctors_list(
            search_term=search_term,
            clinic_name=clinic_name,
            clinic_address=clinic_address,
            specialty=specialty,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            per_page=per_page
        )
        
        return jsonify({
            'success': True,
            'message': 'Lấy danh sách bác sĩ thành công',
            'data': result
        }), 200
        
    except ValueError:
        return jsonify({
            'success': False,
            'message': 'Tham số page hoặc per_page không hợp lệ'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Có lỗi xảy ra khi lấy danh sách bác sĩ',
            'error': str(e)
        }), 500


@doctors_bp.route('/<int:doctor_id>', methods=['GET'])
def get_doctor_details(doctor_id):
    """
    Lấy thông tin chi tiết của một bác sĩ
    """
    try:
        doctor = doctors_service.get_doctor_details(doctor_id)
        
        if not doctor:
            return jsonify({
                'success': False,
                'message': 'Không tìm thấy bác sĩ hoặc bác sĩ chưa được xác minh'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Lấy thông tin bác sĩ thành công',
            'data': doctor
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Có lỗi xảy ra khi lấy thông tin bác sĩ',
            'error': str(e)
        }), 500


@doctors_bp.route('/search', methods=['GET'])
def search_doctors_by_specialty():
    """
    Tìm kiếm bác sĩ theo chuyên khoa
    Query parameters:
    - specialty: chuyên khoa cần tìm (required)
    - limit: giới hạn số lượng kết quả
    """
    try:
        specialty = request.args.get('specialty')
        limit = int(request.args.get('limit', 10))
        
        if not specialty:
            return jsonify({
                'success': False,
                'message': 'Tham số specialty là bắt buộc'
            }), 400
        
        doctors = doctors_service.search_doctors_by_specialty(specialty, limit)
        
        return jsonify({
            'success': True,
            'message': f'Tìm thấy {len(doctors)} bác sĩ có chuyên khoa "{specialty}"',
            'data': doctors
        }), 200
        
    except ValueError:
        return jsonify({
            'success': False,
            'message': 'Tham số limit không hợp lệ'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Có lỗi xảy ra khi tìm kiếm bác sĩ',
            'error': str(e)
        }), 500


@doctors_bp.route('/top-rated', methods=['GET'])
def get_top_rated_doctors():
    """
    Lấy danh sách bác sĩ có rating cao nhất
    Query parameters:
    - limit: số lượng bác sĩ cần lấy
    """
    try:
        limit = int(request.args.get('limit', 10))
        
        doctors = doctors_service.get_top_rated_doctors(limit)
        
        return jsonify({
            'success': True,
            'message': f'Lấy top {len(doctors)} bác sĩ có rating cao nhất',
            'data': doctors
        }), 200
        
    except ValueError:
        return jsonify({
            'success': False,
            'message': 'Tham số limit không hợp lệ'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Có lỗi xảy ra khi lấy danh sách bác sĩ',
            'error': str(e)
        }), 500


@doctors_bp.route('/most-followed', methods=['GET'])
def get_most_followed_doctors():
    """
    Lấy danh sách bác sĩ có nhiều followers nhất
    Query parameters:
    - limit: số lượng bác sĩ cần lấy
    """
    try:
        limit = int(request.args.get('limit', 10))
        
        doctors = doctors_service.get_most_followed_doctors(limit)
        
        return jsonify({
            'success': True,
            'message': f'Lấy top {len(doctors)} bác sĩ có nhiều followers nhất',
            'data': doctors
        }), 200
        
    except ValueError:
        return jsonify({
            'success': False,
            'message': 'Tham số limit không hợp lệ'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Có lỗi xảy ra khi lấy danh sách bác sĩ',
            'error': str(e)
        }), 500


@doctors_bp.route('/specializations', methods=['GET'])
def get_all_specializations():
    """
    Lấy danh sách tất cả chuyên khoa có sẵn
    """
    try:
        specializations = doctors_service.get_all_specializations()
        
        return jsonify({
            'success': True,
            'message': 'Lấy danh sách chuyên khoa thành công',
            'data': specializations
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Có lỗi xảy ra khi lấy danh sách chuyên khoa',
            'error': str(e)
        }), 500


@doctors_bp.route('/statistics', methods=['GET'])
def get_doctors_statistics():
    """
    Lấy thống kê tổng quan về bác sĩ
    """
    try:
        statistics = doctors_service.get_doctors_statistics()
        
        return jsonify({
            'success': True,
            'message': 'Lấy thống kê thành công',
            'data': statistics
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Có lỗi xảy ra khi lấy thống kê',
            'error': str(e)
        }), 500