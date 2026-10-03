from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from extensions import db, socketio
from helpers import (
    current_user_id, error, find_friendship, friend_ids, make_friends, notify, set_swipe,
)
from models import Notification, Swipe, User

bp = Blueprint("matches", __name__, url_prefix="/api")


def pending_like(sender_id, receiver_id):
    return Swipe.query.filter_by(
        swiper_id=sender_id, target_id=receiver_id, action="like", status="pending"
    ).first()


@bp.post("/swipes")
@jwt_required()
def swipe():
    me_id = current_user_id()
    data = request.get_json(silent=True) or {}
    action = data.get("action")
    target = db.session.get(User, data.get("target_id") or 0)

    if action not in ("like", "pass"):
        return error("Invalid action.")
    if not target or target.id == me_id:
        return error("User not found.", 404)
    if find_friendship(me_id, target.id):
        return error("You are already friends.")

    existing = Swipe.query.filter_by(swiper_id=me_id, target_id=target.id).first()
    if existing and existing.action == "like" and action == "like":
        return {"matched": False}

    their_like = pending_like(target.id, me_id)
    matched = action == "like" and their_like is not None

    if matched:
        set_swipe(me_id, target.id, "like", "accepted")
        their_like.status = "accepted"
        make_friends(me_id, target.id)
    elif action == "like":
        set_swipe(me_id, target.id, "like", "pending")
    else:
        set_swipe(me_id, target.id, "pass")
        if their_like:
            their_like.status = "declined"
    db.session.commit()

    if matched:
        notify(target.id, "match", me_id)
        notify(me_id, "match", target.id)
    elif action == "like":
        notify(target.id, "like", me_id)
    return {"matched": matched}


@bp.post("/likes/<int:user_id>/accept")
@jwt_required()
def accept_like(user_id):
    me_id = current_user_id()
    like = pending_like(user_id, me_id)
    if not like:
        return error("This like is no longer pending.", 404)

    like.status = "accepted"
    set_swipe(me_id, user_id, "like", "accepted")
    make_friends(me_id, user_id)
    db.session.commit()
    notify(user_id, "match", me_id)
    return {"ok": True}


@bp.post("/likes/<int:user_id>/decline")
@jwt_required()
def decline_like(user_id):
    me_id = current_user_id()
    like = pending_like(user_id, me_id)
    if not like:
        return error("This like is no longer pending.", 404)

    like.status = "declined"
    set_swipe(me_id, user_id, "pass")
    db.session.commit()
    return {"ok": True}


@bp.get("/friends")
@jwt_required()
def friends():
    ids = friend_ids(current_user_id())
    users = User.query.filter(User.id.in_(ids)).order_by(User.name).all() if ids else []
    return {"friends": [user.to_card() for user in users]}


@bp.delete("/friends/<int:user_id>")
@jwt_required()
def unfriend(user_id):
    me_id = current_user_id()
    friendship = find_friendship(me_id, user_id)
    if not friendship:
        return error("You are not friends.", 404)

    db.session.delete(friendship)
    set_swipe(me_id, user_id, "pass")
    set_swipe(user_id, me_id, "pass")
    db.session.commit()
    socketio.emit("unfriended", {"user_id": me_id}, to=f"user_{user_id}")
    return {"ok": True}


@bp.get("/notifications")
@jwt_required()
def notifications():
    me_id = current_user_id()
    items = (
        Notification.query.filter_by(user_id=me_id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(50)
        .all()
    )
    unread = Notification.query.filter_by(user_id=me_id, is_read=False).count()
    return {"notifications": [item.to_dict() for item in items], "unread": unread}


@bp.post("/notifications/read")
@jwt_required()
def mark_read():
    Notification.query.filter_by(user_id=current_user_id(), is_read=False).update({"is_read": True})
    db.session.commit()
    return {"ok": True}
