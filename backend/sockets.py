from flask_jwt_extended import decode_token
from flask_socketio import join_room

from extensions import socketio


@socketio.on("connect")
def handle_connect(auth):
    try:
        user_id = decode_token((auth or {}).get("token", ""))["sub"]
    except Exception:
        return False
    join_room(f"user_{user_id}")
