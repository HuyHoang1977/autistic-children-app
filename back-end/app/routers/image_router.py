from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from app.services.minio_service import minio_service
from app.models.users_model import User
from app.models.articles_model import Article
from app.extensions import db
import requests
from io import BytesIO

bp = Blueprint('image_routes', __name__, url_prefix='/api/images')


@bp.route('/upload', methods=['POST'])
def upload_image():
    """
    Upload ảnh lên MinIO
    Body: multipart/form-data
    - file: File ảnh
    - bucket_type: 'avatars', 'articles', 'medical', 'general' (optional, default: 'general')
    - folder: folder con (optional)
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Không có file trong request'}), 400

        file = request.files['file']
        bucket_type = request.form.get('bucket_type', 'general')
        folder = request.form.get('folder', '')

        result = minio_service.upload_file(file, bucket_type, folder)

        if result['success']:
            return jsonify({
                'message': 'Upload thành công',
                'file_url': result['file_url'],
                'bucket': result['bucket'],
                'object_name': result['object_name'],
                'original_filename': result['original_filename']
            }), 200
        else:
            return jsonify({'error': result['error']}), 400

    except Exception as e:
        return jsonify({'error': f'Lỗi server: {str(e)}'}), 500


@bp.route('/delete', methods=['DELETE'])
def delete_image():
    """
    Xóa ảnh từ MinIO
    Body: JSON
    - file_url: URL của file cần xóa
    """
    try:
        data = request.get_json()
        if not data or 'file_url' not in data:
            return jsonify({'error': 'Thiếu file_url'}), 400

        result = minio_service.delete_file_by_url(data['file_url'])

        if result['success']:
            return jsonify({'message': 'Xóa file thành công'}), 200
        else:
            return jsonify({'error': result['error']}), 400

    except Exception as e:
        return jsonify({'error': f'Lỗi server: {str(e)}'}), 500


@bp.route('/list', methods=['GET'])
def list_images():
    """
    Liệt kê ảnh trong bucket
    Query params:
    - bucket_type: 'avatars', 'articles', 'medical', 'general' (default: 'general')
    - folder: folder con (optional)
    """
    try:
        bucket_type = request.args.get('bucket_type', 'general')
        folder = request.args.get('folder', '')

        files = minio_service.list_files(bucket_type, folder)

        return jsonify({
            'files': files,
            'count': len(files)
        }), 200

    except Exception as e:
        return jsonify({'error': f'Lỗi server: {str(e)}'}), 500


@bp.route('/avatar/upload/<int:user_id>', methods=['POST'])
def upload_avatar(user_id):
    """
    Upload avatar cho user
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User không tồn tại'}), 404

        if 'file' not in request.files:
            return jsonify({'error': 'Không có file trong request'}), 400

        file = request.files['file']

        # Xóa avatar cũ nếu có
        if user.avatar_url:
            minio_service.delete_file_by_url(user.avatar_url)

        # Upload avatar mới
        result = minio_service.upload_file(file, 'avatars', f'user_{user_id}')

        if result['success']:
            # Cập nhật avatar_url trong database
            user.avatar_url = result['file_url']
            db.session.commit()

            return jsonify({
                'message': 'Upload avatar thành công',
                'avatar_url': result['file_url'],
                'user_id': user_id
            }), 200
        else:
            return jsonify({'error': result['error']}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi server: {str(e)}'}), 500


@bp.route('/article/upload/<int:article_id>', methods=['POST'])
def upload_article_image(article_id):
    """
    Upload ảnh cho article
    """
    try:
        article = Article.query.get(article_id)
        if not article:
            return jsonify({'error': 'Article không tồn tại'}), 404

        if 'file' not in request.files:
            return jsonify({'error': 'Không có file trong request'}), 400

        file = request.files['file']
        image_type = request.form.get('image_type', 'featured')  # 'featured' hoặc 'content'

        # Upload ảnh
        result = minio_service.upload_file(file, 'articles', f'article_{article_id}')

        if result['success']:
            # Cập nhật featured_image trong database nếu là ảnh đại diện
            if image_type == 'featured':
                # Xóa ảnh cũ nếu có
                if article.featured_image:
                    minio_service.delete_file_by_url(article.featured_image)

                article.featured_image = result['file_url']
                db.session.commit()

            return jsonify({
                'message': 'Upload ảnh article thành công',
                'image_url': result['file_url'],
                'article_id': article_id,
                'image_type': image_type
            }), 200
        else:
            return jsonify({'error': result['error']}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi server: {str(e)}'}), 500


@bp.route('/proxy/<path:file_path>')
def proxy_image(file_path):
    """
    Proxy để hiển thị ảnh từ MinIO (giải quyết CORS)
    """
    try:
        # Tạo URL đầy đủ tới MinIO
        minio_url = f"http://127.0.0.1:9000/{file_path}"

        # Fetch ảnh từ MinIO
        response = requests.get(minio_url)
        if response.status_code == 200:
            return send_file(
                BytesIO(response.content),
                mimetype=response.headers.get('content-type', 'application/octet-stream'),
                as_attachment=False
            )
        else:
            return jsonify({'error': 'File không tồn tại'}), 404

    except Exception as e:
        return jsonify({'error': f'Lỗi proxy: {str(e)}'}), 500


@bp.route('/update', methods=['PUT'])
def update_image():
    """
    Cập nhật ảnh: thay thế ảnh cũ bằng ảnh mới
    Body: multipart/form-data
    - file: File ảnh mới
    - old_file_url: URL của file cũ cần thay thế
    - bucket_type: loại bucket (optional)
    - folder: folder con (optional)
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Không có file mới trong request'}), 400

        file = request.files['file']
        old_file_url = request.form.get('old_file_url')
        bucket_type = request.form.get('bucket_type', 'general')
        folder = request.form.get('folder', '')

        result = minio_service.update_file(old_file_url, file, bucket_type, folder)

        if result['success']:
            return jsonify({
                'message': 'Cập nhật file thành công',
                'new_file_url': result['file_url'],
                'bucket': result['bucket'],
                'object_name': result['object_name']
            }), 200
        else:
            return jsonify({'error': result['error']}), 400

    except Exception as e:
        return jsonify({'error': f'Lỗi server: {str(e)}'}), 500