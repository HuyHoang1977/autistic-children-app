# seeds.py
from app.models.users_model import User
from app.models.roles_model import Role
from app.models.admins_model import Admin
from app.models.doctors_model import Doctor
from app.models.parents_model import Parent
from app import create_app, db

def seed_data():
    app = create_app()
    with app.app_context():
        # # Xóa dữ liệu cũ (nếu muốn làm mới)
        # db.session.query(Admin).delete()
        # db.session.query(Doctor).delete()
        # db.session.query(Parent).delete()
        # db.session.query(User).delete()
        # db.session.query(Role).delete()
        # db.session.commit()

        # Seed roles
        admin_role = Role(role_name='ADMIN', description='Administrator')
        doctor_role = Role(role_name='DOCTOR', description='Medical Professional')
        parent_role = Role(role_name='PARENT', description='Parent User')
        db.session.add_all([admin_role, doctor_role, parent_role])
        db.session.commit()

        # Seed users
        admin_user = User(
            username='admin',
            email='admin@example.com',
            full_name='Admin User',
            user_type=1,
            role_id=admin_role.role_id
        )
        doctor_user = User(
            username='doctor',
            email='doctor@example.com',
            full_name='Doctor User',
            user_type=2,
            role_id=doctor_role.role_id
        )
        parent_user = User(
            username='parent',
            email='parent@example.com',
            full_name='Parent User',
            user_type=3,
            role_id=parent_role.role_id
        )
        parent_user.set_password('12345678')
        admin_user.set_password('12345678')
        doctor_user.set_password('12345678')
        
        db.session.add_all([admin_user, doctor_user, parent_user])
        db.session.commit()

        # Seed admins
        admin = Admin(
            user_id=admin_user.user_id,
            admin_role='SuperAdmin',
            permissions='all',
            last_login=None,
            role_id=admin_role.role_id
        )
        db.session.add(admin)

        # Seed doctors
        doctor = Doctor(
            user_id=doctor_user.user_id,
            license_number='DOC12345',
            specialty='Pediatrics',
            years_experience=10,
            bio='Experienced pediatrician.',
            clinic_name='Health Clinic',
            clinic_address='123 Main St',
            verified=True,
            verification_date=None,
            rating=4.8,
            total_reviews=50,
            role_id=doctor_role.role_id
        )
        db.session.add(doctor)

        # Seed parents
        parent = Parent(
            user_id=parent_user.user_id,
            number_of_children=2,
            children_info='Child1: 5 years, Child2: 3 years',
            parenting_concerns='Nutrition, Education',
            last_activity=None,
            role_id=parent_role.role_id
        )
        db.session.add(parent)

        db.session.commit()

if __name__ == '__main__':
    seed_data()
