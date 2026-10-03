import json
import os
import uuid
from datetime import date

from flask import current_app, request
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import or_

from extensions import db, socketio
from models import (
    Friendship, Notification, Swipe, User, UserArtist, UserCoverBand, UserGenre,
    UserInstrument, calculate_age,
)
from options import BAND_TYPES, GENRE_LIST, SEARCH_RANGES

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


def error(message, status=400):
    return {"error": message}, status


def current_user_id():
    return int(get_jwt_identity())


def current_user():
    return db.session.get(User, current_user_id())


def form_data():
    try:
        return json.loads(request.form.get("data") or "{}")
    except json.JSONDecodeError:
        raise ValueError("Invalid form data.")


def save_photo(file):
    extension = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("The photo must be a PNG, JPG or WEBP image.")
    filename = f"{uuid.uuid4().hex}.{extension}"
    file.save(os.path.join(current_app.config["UPLOAD_FOLDER"], filename))
    return filename


def clean_list(values):
    items = []
    for value in values or []:
        value = str(value).strip()[:100]
        if value and value not in items:
            items.append(value)
    return items


def validate_profile(data):
    profile = {
        "name": str(data.get("name", "")).strip(),
        "description": str(data.get("description", "")).strip(),
        "country": str(data.get("country", "")).strip(),
        "state": str(data.get("state", "")).strip(),
        "city": str(data.get("city", "")).strip(),
        "band_type": data.get("band_type"),
        "search_range": data.get("search_range"),
        "instruments": clean_list(data.get("instruments")),
        "genres": clean_list(data.get("genres")),
        "artists": clean_list(data.get("artists")),
        "cover_bands": clean_list(data.get("cover_bands")),
    }

    if not profile["name"] or len(profile["name"]) > 80:
        raise ValueError("Name is required (max 80 characters).")
    if len(profile["description"]) > 500:
        raise ValueError("The description can have at most 500 characters.")
    if not profile["instruments"]:
        raise ValueError("Pick at least one instrument.")
    if not 1 <= len(profile["genres"]) <= 5:
        raise ValueError("Pick between 1 and 5 genres.")
    if any(genre not in GENRE_LIST for genre in profile["genres"]):
        raise ValueError("Unknown genre.")
    if len(profile["artists"]) > 3:
        raise ValueError("Pick at most 3 artists.")
    if profile["band_type"] not in BAND_TYPES:
        raise ValueError("Choose cover, original or both.")
    if profile["band_type"] == "original":
        profile["cover_bands"] = []
    elif len(profile["cover_bands"]) > 3:
        raise ValueError("Pick at most 3 bands to cover.")
    if profile["search_range"] not in SEARCH_RANGES:
        raise ValueError("Invalid search range.")
    if not (profile["country"] and profile["state"] and profile["city"]):
        raise ValueError("Country, state and city are required.")

    try:
        profile["birth_date"] = date.fromisoformat(str(data.get("birth_date", "")))
    except ValueError:
        raise ValueError("Invalid birth date.")
    if calculate_age(profile["birth_date"]) < 18:
        raise ValueError("You must be at least 18 years old.")

    return profile


def apply_profile(user, profile):
    for field in ("name", "description", "country", "state", "city", "band_type", "search_range", "birth_date"):
        setattr(user, field, profile[field])
    user.instruments = [UserInstrument(name=name) for name in profile["instruments"]]
    user.genres = [UserGenre(name=name) for name in profile["genres"]]
    user.artists = [UserArtist(name=name) for name in profile["artists"]]
    user.cover_bands = [UserCoverBand(name=name) for name in profile["cover_bands"]]


def find_friendship(user_id, other_id):
    a, b = sorted((user_id, other_id))
    return Friendship.query.filter_by(user_a_id=a, user_b_id=b).first()


def make_friends(user_id, other_id):
    if not find_friendship(user_id, other_id):
        a, b = sorted((user_id, other_id))
        db.session.add(Friendship(user_a_id=a, user_b_id=b))


def friend_ids(user_id):
    rows = Friendship.query.filter(
        or_(Friendship.user_a_id == user_id, Friendship.user_b_id == user_id)
    ).all()
    return [row.user_b_id if row.user_a_id == user_id else row.user_a_id for row in rows]


def set_swipe(swiper_id, target_id, action, status=None):
    swipe = Swipe.query.filter_by(swiper_id=swiper_id, target_id=target_id).first()
    if not swipe:
        swipe = Swipe(swiper_id=swiper_id, target_id=target_id)
        db.session.add(swipe)
    swipe.action = action
    swipe.status = status
    return swipe


def notify(user_id, type, actor_id, band_id=None):
    notification = Notification(user_id=user_id, type=type, actor_id=actor_id, band_id=band_id)
    db.session.add(notification)
    db.session.commit()
    socketio.emit("notification", notification.to_dict(), to=f"user_{user_id}")
