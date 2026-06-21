from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(password):
    return generate_password_hash(password)
def verify_password(password, pw_hash):
    return check_password_hash(pw_hash, password)