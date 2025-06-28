from app.models.users_model import User
from app.models.parents_model import Parent
from app.models.doctors_model import Doctor
from app.models.childs_model import Child
from app.extensions import db
from .base_repository import BaseRepository

class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__(User)

class ParentRepository(BaseRepository):
    def __init__(self):
        super().__init__(Parent)

    def get_by_user_id(self, user_id):
        return self.model.query.filter_by(user_id=user_id).first()

class DoctorRepository(BaseRepository):
    def __init__(self):
        super().__init__(Doctor)

    def get_by_user_id(self, user_id):
        return self.model.query.filter_by(user_id=user_id).first()

class ChildRepository(BaseRepository):
    def __init__(self):
        super().__init__(Child)

    def get_by_parent_id(self, parent_id):
        return self.model.query.filter_by(parent_id=parent_id).all()

    def get_by_id(self, child_id):
        return self.model.query.filter_by(child_id=child_id).first()

# Gộp lại thành 1 repository tổng hợp nếu muốn dùng chung:
class ProfileRepository:
    def __init__(self):
        self.user_repo = UserRepository()
        self.parent_repo = ParentRepository()
        self.doctor_repo = DoctorRepository()
        self.child_repo = ChildRepository()

    # USER
    def get_user_by_id(self, user_id):
        return self.user_repo.get_by_id(user_id)

    def update_user(self, user_id, **kwargs):
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        return self.user_repo.update(user, **kwargs)

    # PARENT
    def get_parent_by_user_id(self, user_id):
        return self.parent_repo.get_by_user_id(user_id)

    def get_parent_by_id(self, parent_id):
        return self.parent_repo.get_by_id(parent_id)

    def update_parent(self, user_id, **kwargs):
        parent = self.get_parent_by_user_id(user_id)
        if not parent:
            return None
        return self.parent_repo.update(parent, **kwargs)
    
    def update_parent_by_id(self, parent_id, **kwargs):
        parent = self.get_parent_by_id(parent_id)
        if not parent:
            return None
        return self.parent_repo.update(parent, **kwargs)

    # DOCTOR
    def get_doctor_by_user_id(self, user_id):
        return self.doctor_repo.get_by_user_id(user_id)

    def update_doctor(self, user_id, **kwargs):
        doctor = self.get_doctor_by_user_id(user_id)
        if not doctor:
            return None
        return self.doctor_repo.update(doctor, **kwargs)

    # CHILD
    def get_childs_by_parent_id(self, parent_id):
        return self.child_repo.get_by_parent_id(parent_id)

    def get_child_by_id(self, child_id):
        return self.child_repo.get_by_id(child_id)

    def add_child(self, parent_id, **kwargs):
        return self.child_repo.create(parent_id=parent_id, **kwargs)

    def update_child(self, child_id, **kwargs):
        child = self.get_child_by_id(child_id)
        if not child:
            return None
        return self.child_repo.update(child, **kwargs)

    def delete_child(self, child_id):
        child = self.get_child_by_id(child_id)
        if not child:
            return False
        return self.child_repo.delete(child)