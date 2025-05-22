from app.models.models import User, db

def get_user_by_email(email):
    return User.query.filter_by(email=email).first()

def create_user(name, email, password):
    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user