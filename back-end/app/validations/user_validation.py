def validate_login_data(data):
    errors = []
    if not data or 'email' not in data or not data['email']:
        errors.append("Email is required.")
    if not data or 'password' not in data or not data['password']:
        errors.append("Password is required.")
    return errors

def validate_register_data(data):
    errors = []
    if not data or 'name' not in data or not data['name']:
        errors.append("Name is required.")
    if not data or 'email' not in data or not data['email']:
        errors.append("Email is required.")
    if not data or 'password' not in data or not data['password']:
        errors.append("Password is required.")
    return errors