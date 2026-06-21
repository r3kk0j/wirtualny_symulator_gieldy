from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(password):
    # Zamienia "admin" na coś w stylu "pbkdf2:sha256:260000$..."
    return generate_password_hash(password)

def verify_password(password, pw_hash):
    # Porównuje wpisane hasło z hashem w bazie
    return check_password_hash(pw_hash, password)