from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import and_, or_

from extensions import db, socketio
from helpers import current_user_id, error, find_friendship
from models import DirectMessage

bp = Blueprint("chat", __name__, url_prefix="/api/chat")


@bp.get("/<int:friend_id>/messages")
@jwt_required()
def get_messages(friend_id):
    me_id = current_user_id()
    if not find_friendship(me_id, friend_id):
        return error("You are not friends with this user.", 403)

    messages = (
        DirectMessage.query.filter(
            or_(
                and_(DirectMessage.sender_id == me_id, DirectMessage.receiver_id == friend_id),
                and_(DirectMessage.sender_id == friend_id, DirectMessage.receiver_id == me_id),
            )
        )
        .order_by(DirectMessage.created_at, DirectMessage.id)
        .all()
    )
    return {"messages": [message.to_dict() for message in messages]}


@bp.post("/<int:friend_id>/messages")
@jwt_required()
def send_message(friend_id):
    me_id = current_user_id()
    if not find_friendship(me_id, friend_id):
        return error("You are not friends with this user.", 403)

    content = str((request.get_json(silent=True) or {}).get("content", "")).strip()
    if not content or len(content) > 1000:
        return error("Messages must have between 1 and 1000 characters.")

    message = DirectMessage(sender_id=me_id, receiver_id=friend_id, content=content)
    db.session.add(message)
    db.session.commit()

    payload = message.to_dict()
    for user_id in (me_id, friend_id):
        socketio.emit("direct_message", payload, to=f"user_{user_id}")
    return payload, 201
