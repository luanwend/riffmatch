from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db
from helpers import apply_profile, current_user, error, form_data, save_photo, validate_profile
from models import User

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def auth_response(user):
    return {"token": create_access_token(identity=str(user.id)), "user": user.to_private()}


@bp.post("/register")
def register():
    try:
        data = form_data()
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))
        if "@" not in email or len(email) > 120:
            raise ValueError("Enter a valid email.")
        if len(password) < 6:
            raise ValueError("The password must have at least 6 characters.")
        if User.query.filter_by(email=email).first():
            raise ValueError("This email is already registered.")
        profile = validate_profile(data)
        if "photo" not in request.files:
            raise ValueError("A profile photo is required.")
        photo = save_photo(request.files["photo"])
    except ValueError as e:
        return error(str(e))

    user = User(email=email, password_hash=generate_password_hash(password), photo=photo)
    apply_profile(user, profile)
    db.session.add(user)
    db.session.commit()
    return auth_response(user), 201


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, str(data.get("password", ""))):
        return error("Invalid email or password.")
    return auth_response(user)


@bp.get("/me")
@jwt_required()
def me():
    user = current_user()
    if not user:
        return error("User not found.", 401)
    return user.to_private()
