from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from extensions import db
from helpers import (
    apply_profile, current_user, error, find_friendship, form_data, friend_ids, save_photo,
    validate_profile,
)
from models import Swipe, User, UserGenre
from options import COVER_BAND_SUGGESTIONS, GENRES, INSTRUMENTS, SEARCH_RANGES

bp = Blueprint("users", __name__, url_prefix="/api")


@bp.get("/options")
def options():
    return {
        "instruments": INSTRUMENTS,
        "genres": [{"family": family, "genres": genres} for family, genres in GENRES.items()],
        "cover_bands": COVER_BAND_SUGGESTIONS,
    }


@bp.get("/discover")
@jwt_required()
def discover():
    me = current_user()
    query = User.query.filter(User.id != me.id, User.country == me.country)
    if me.search_range in ("state", "city"):
        query = query.filter(User.state == me.state)
    if me.search_range == "city":
        query = query.filter(User.city == me.city)

    swiped = db.select(Swipe.target_id).where(Swipe.swiper_id == me.id)
    query = query.filter(User.id.not_in(swiped))
    friends = friend_ids(me.id)
    if friends:
        query = query.filter(User.id.not_in(friends))

    genres = [genre for genre in request.args.get("genres", "").split(",") if genre]
    if genres:
        query = query.join(UserGenre).filter(UserGenre.name.in_(genres)).distinct()

    users = query.order_by(User.created_at.desc()).limit(30).all()
    return {"users": [user.to_card() for user in users]}


@bp.get("/users/<int:user_id>")
@jwt_required()
def get_user(user_id):
    me = current_user()
    user = db.session.get(User, user_id)
    if not user:
        return error("User not found.", 404)

    my_swipe = Swipe.query.filter_by(swiper_id=me.id, target_id=user.id).first()
    their_like = Swipe.query.filter_by(
        swiper_id=user.id, target_id=me.id, action="like", status="pending"
    ).first()
    return {
        **user.to_profile(),
        "is_me": user.id == me.id,
        "is_friend": find_friendship(me.id, user.id) is not None,
        "my_swipe": my_swipe.action if my_swipe else None,
        "liked_me": their_like is not None,
    }


@bp.put("/users/me")
@jwt_required()
def update_me():
    user = current_user()
    try:
        profile = validate_profile(form_data())
        if "photo" in request.files:
            user.photo = save_photo(request.files["photo"])
    except ValueError as e:
        return error(str(e))

    apply_profile(user, profile)
    db.session.commit()
    return user.to_private()


@bp.patch("/users/me/range")
@jwt_required()
def update_range():
    user = current_user()
    search_range = (request.get_json(silent=True) or {}).get("search_range")
    if search_range not in SEARCH_RANGES:
        return error("Invalid search range.")

    user.search_range = search_range
    db.session.commit()
    return user.to_private()
