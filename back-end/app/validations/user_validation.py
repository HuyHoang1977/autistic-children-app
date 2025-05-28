def validate_login_data(data):
    errors = []
    if not data or 'email' not in data or not data['email']:
        errors.append("Email is required.")
    if not data or 'password' not in data or not data['password']:
        errors.append("Password is required.")
    return errors

def validate_register_data(data):
    errors = []
    if not data or 'username' not in data or not data['username']:
        errors.append("Username is required.")
    if not data or 'email' not in data or not data['email']:
        errors.append("Email is required.")
    if not data or 'password' not in data or not data['password']:
        errors.append("Password is required.")
    # Optional: kiểm tra các trường khác nếu muốn
    # if not data or 'full_name' not in data or not data['full_name']:
    #     errors.append("Full name is required.")
    # if not data or 'user_type' not in data or not data['user_type']:
    #     errors.append("User type is required.")
    return errors