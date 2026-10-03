import os

from flask import Flask, send_from_directory

import models  # noqa: F401
from config import Config
from extensions import db, jwt, socketio
from routes.auth import bp as auth_bp
from routes.bands import bp as bands_bp
from routes.chat import bp as chat_bp
from routes.matches import bp as matches_bp
from routes.users import bp as users_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    jwt.init_app(app)
    socketio.init_app(app)

    for blueprint in (auth_bp, users_bp, matches_bp, chat_bp, bands_bp):
        app.register_blueprint(blueprint)

    import sockets  # noqa: F401

    @app.route("/uploads/<path:filename>")
    def uploads(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    @app.errorhandler(413)
    def too_large(_):
        return {"error": "The photo is too large (max 5 MB)."}, 413

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    socketio.run(app, host="127.0.0.1", port=5000, debug=True, use_debugger=False, allow_unsafe_werkzeug=True)
