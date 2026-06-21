from flask import Blueprint, request, jsonify
from sqlalchemy import create_engine, text
from config import DATABASE_URL
from auth_utils import hash_password, verify_password
import secrets
from functools import wraps

user_bp = Blueprint('user', __name__)
engine = create_engine(DATABASE_URL)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"message": "Brak tokena!"}), 401
        token = auth_header.replace("Bearer ", "")
        with engine.connect() as conn:
            session = conn.execute(
                text("SELECT username FROM active_sessions WHERE token = :t"),
                {"t": token}
            ).fetchone()
            if not session:
                return jsonify({"message": "Sesja wygasła"}), 401
            return f(session[0], *args, **kwargs)

    return decorated_function

@user_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    u, p = data.get('user'), data.get('pass')
    if not u or not p:
        return jsonify({"message": "Podaj login i hasło"}), 400
    hashed = hash_password(p)
    try:
        with engine.connect() as conn:
            conn.execute(
                text("INSERT INTO users (username, password_hash) VALUES (:u, :p)"),
                {"u": u, "p": hashed}
            )
            conn.commit()
        return jsonify({"message": "Zarejestrowano"}), 201
    except Exception:
        return jsonify({"message": "Użytkownik istnieje"}), 400

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    with engine.connect() as conn:
        user = conn.execute(
            text("SELECT password_hash FROM users WHERE username = :u"),
            {"u": data['user']}
        ).fetchone()

        if user and verify_password(data['pass'], user[0]):
            token = secrets.token_hex(32)
            conn.execute(text("DELETE FROM active_sessions WHERE username = :u"), {"u": data['user']})
            conn.execute(text("INSERT INTO active_sessions (username, token) VALUES (:u, :t)"),
                         {"u": data['user'], "t": token})

            wallet_info = conn.execute(
                text("SELECT wallet, walletBTC FROM users WHERE username = :u"),
                {"u": data['user']}
            ).fetchone()
            conn.commit()

            return jsonify({
                "token": token,
                "username": data['user'],
                "wallet": float(wallet_info[0]),
                "walletBTC": float(wallet_info[1])
            }), 200
    return jsonify({"message": "Błąd logowania"}), 401


@user_bp.route('/trade', methods=['POST'])
@login_required
def trade(username):
    data = request.json
    try:
        amount = float(data['amount'])
        price = float(data['price'])
        trade_type = data['type']
        total_value = amount * price
    except:
        return jsonify({"message": "Błędne dane"}), 400

    with engine.connect() as conn:
        user = conn.execute(
            text("SELECT id, wallet, walletBTC FROM users WHERE username = :u"),
            {"u": username}
        ).fetchone()

        user_id, curr_usd, curr_btc = user[0], float(user[1]), float(user[2])

        if trade_type == 'buy':
            if curr_usd < total_value: return jsonify({"message": "Brak USD"}), 400
            new_usd, new_btc = curr_usd - total_value, curr_btc + amount
        else:
            if curr_btc < amount: return jsonify({"message": "Brak BTC"}), 400
            new_usd, new_btc = curr_usd + total_value, curr_btc - amount

        conn.execute(
            text("UPDATE users SET wallet = :u, walletBTC = :b WHERE id = :id"),
            {"u": new_usd, "b": new_btc, "id": user_id}
        )
        conn.execute(
            text("INSERT INTO trade_history (user_id, type, amount, price, value) VALUES (:uid, :t, :a, :p, :v)"),
            {"uid": user_id, "t": trade_type, "a": amount, "p": price, "v": total_value}
        )
        conn.commit()
        return jsonify({"wallet": new_usd, "walletBTC": new_btc, "message": "Sukces"})


@user_bp.route('/history', methods=['GET'])
@login_required
def get_history(username):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT th.type, th.amount, th.price, th.value, th.date, u.username 
                FROM trade_history th 
                JOIN users u ON th.user_id = u.id 
                WHERE u.username = :u ORDER BY th.date DESC
            """), {"u": username}
        ).fetchall()

        return jsonify([{
            "type": "KUPNO" if r[0] == 'buy' else "SPRZEDAŻ",
            "amount": float(r[1]),
            "price": float(r[2]),
            "value": float(r[3]),
            "date": r[4].strftime("%Y-%m-%d %H:%M:%S"),
            "user": r[5]
        } for r in result])

@user_bp.route('/change-password', methods=['POST'])
@login_required
def change_password(username):
    data = request.json
    old_p = data.get('oldPassword')
    new_p = data.get('newPassword')

    if not old_p or not new_p:
        return jsonify({"message": "Wypełnij oba pola"}), 400

    with engine.connect() as conn:
        user = conn.execute(
            text("SELECT password_hash FROM users WHERE username = :u"),
            {"u": username}
        ).fetchone()

        if not user or not verify_password(old_p, user[0]):
            return jsonify({"message": "Stare hasło jest niepoprawne"}), 401

        new_hashed = hash_password(new_p)
        conn.execute(
            text("UPDATE users SET password_hash = :p WHERE username = :u"),
            {"p": new_hashed, "u": username}
        )
        conn.commit()
        return jsonify({"message": "Hasło zostało zmienione"}), 200


@user_bp.route('/delete-account', methods=['POST'])
@login_required
def delete_account(username):
    data = request.json
    password = data.get('password')

    if not password:
        return jsonify({"message": "Hasło jest wymagane"}), 400

    try:
        with engine.connect() as conn:
            user = conn.execute(
                text("SELECT id, password_hash FROM users WHERE username = :u"),
                {"u": username}
            ).fetchone()

            if not user:
                return jsonify({"message": "Użytkownik nie istnieje"}), 404

            user_id, pw_hash = user[0], user[1]

            if not verify_password(password, pw_hash):
                return jsonify({"message": "Niepoprawne hasło"}), 401

            conn.execute(text("DELETE FROM active_sessions WHERE username = :u"), {"u": username})
            conn.execute(text("DELETE FROM trade_history WHERE user_id = :uid"), {"uid": user_id})
            conn.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": user_id})

            conn.commit()
            return jsonify({"message": "Konto zostało usunięte"}), 200
    except Exception as e:
        print(f"Błąd usuwania: {e}")
        return jsonify({"message": "Błąd serwera"}), 500