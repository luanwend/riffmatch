from datetime import date, datetime, timezone

from extensions import db


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def iso(value):
    return value.isoformat() + "Z" if value else None


def calculate_age(birth_date):
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    country = db.Column(db.String(100), nullable=False, index=True)
    state = db.Column(db.String(100), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    photo = db.Column(db.String(255))
    band_type = db.Column(db.String(10), nullable=False)
    search_range = db.Column(db.String(10), nullable=False, default="city")
    created_at = db.Column(db.DateTime, default=utcnow)

    instruments = db.relationship("UserInstrument", cascade="all, delete-orphan", lazy="selectin", order_by="UserInstrument.id")
    genres = db.relationship("UserGenre", cascade="all, delete-orphan", lazy="selectin", order_by="UserGenre.id")
    artists = db.relationship("UserArtist", cascade="all, delete-orphan", lazy="selectin", order_by="UserArtist.id")
    cover_bands = db.relationship("UserCoverBand", cascade="all, delete-orphan", lazy="selectin", order_by="UserCoverBand.id")

    @property
    def age(self):
        return calculate_age(self.birth_date)

    def to_summary(self):
        return {"id": self.id, "name": self.name, "photo": self.photo}

    def to_card(self):
        return {
            **self.to_summary(),
            "age": self.age,
            "description": self.description,
            "country": self.country,
            "state": self.state,
            "city": self.city,
            "instruments": [i.name for i in self.instruments],
            "genres": [g.name for g in self.genres],
        }

    def to_profile(self):
        return {
            **self.to_card(),
            "artists": [a.name for a in self.artists],
            "cover_bands": [c.name for c in self.cover_bands],
            "band_type": self.band_type,
        }

    def to_private(self):
        return {
            **self.to_profile(),
            "email": self.email,
            "birth_date": self.birth_date.isoformat(),
            "search_range": self.search_range,
        }


class UserInstrument(db.Model):
    __tablename__ = "user_instruments"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)


class UserGenre(db.Model):
    __tablename__ = "user_genres"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False, index=True)


class UserArtist(db.Model):
    __tablename__ = "user_artists"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)


class UserCoverBand(db.Model):
    __tablename__ = "user_cover_bands"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)


class Swipe(db.Model):
    __tablename__ = "swipes"
    __table_args__ = (db.UniqueConstraint("swiper_id", "target_id"),)

    id = db.Column(db.Integer, primary_key=True)
    swiper_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    target_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    action = db.Column(db.String(10), nullable=False)
    status = db.Column(db.String(10))
    created_at = db.Column(db.DateTime, default=utcnow)


class Friendship(db.Model):
    __tablename__ = "friendships"
    __table_args__ = (db.UniqueConstraint("user_a_id", "user_b_id"),)

    id = db.Column(db.Integer, primary_key=True)
    user_a_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user_b_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=utcnow)


class DirectMessage(db.Model):
    __tablename__ = "direct_messages"
    __table_args__ = (db.Index("ix_direct_messages_pair", "sender_id", "receiver_id"),)

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "content": self.content,
            "created_at": iso(self.created_at),
        }


class Band(db.Model):
    __tablename__ = "bands"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.String(300), nullable=False, default="")
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    members = db.relationship("BandMember", cascade="all, delete-orphan", order_by="BandMember.joined_at")
    invites = db.relationship("BandInvite", cascade="all, delete-orphan")
    messages = db.relationship("BandMessage", cascade="all, delete-orphan")

    def to_dict(self, detail=False):
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "owner_id": self.owner_id,
            "member_count": len(self.members),
            "member_ids": [m.user_id for m in self.members],
            "invited_ids": [i.invitee_id for i in self.invites if i.status == "pending"],
        }
        if detail:
            data["members"] = [m.user.to_summary() for m in self.members]
            data["pending_invites"] = [i.invitee.to_summary() for i in self.invites if i.status == "pending"]
        return data


class BandMember(db.Model):
    __tablename__ = "band_members"

    band_id = db.Column(db.Integer, db.ForeignKey("bands.id"), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), primary_key=True)
    joined_at = db.Column(db.DateTime, default=utcnow)

    user = db.relationship("User")


class BandInvite(db.Model):
    __tablename__ = "band_invites"

    id = db.Column(db.Integer, primary_key=True)
    band_id = db.Column(db.Integer, db.ForeignKey("bands.id"), nullable=False, index=True)
    inviter_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    invitee_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    status = db.Column(db.String(10), nullable=False, default="pending")
    created_at = db.Column(db.DateTime, default=utcnow)

    band = db.relationship("Band", viewonly=True)
    invitee = db.relationship("User", foreign_keys=[invitee_id])


class BandMessage(db.Model):
    __tablename__ = "band_messages"

    id = db.Column(db.Integer, primary_key=True)
    band_id = db.Column(db.Integer, db.ForeignKey("bands.id"), nullable=False, index=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    sender = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "band_id": self.band_id,
            "sender_id": self.sender_id,
            "sender": self.sender.to_summary(),
            "content": self.content,
            "created_at": iso(self.created_at),
        }


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    type = db.Column(db.String(20), nullable=False)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    band_id = db.Column(db.Integer, db.ForeignKey("bands.id", ondelete="CASCADE"))
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    actor = db.relationship("User", foreign_keys=[actor_id])
    band = db.relationship("Band", viewonly=True)

    def to_dict(self):
        data = {
            "id": self.id,
            "type": self.type,
            "is_read": self.is_read,
            "created_at": iso(self.created_at),
            "actor": self.actor.to_summary(),
            "band": {"id": self.band.id, "name": self.band.name} if self.band else None,
            "pending": False,
        }
        if self.type == "like":
            like = Swipe.query.filter_by(
                swiper_id=self.actor_id, target_id=self.user_id, action="like", status="pending"
            ).first()
            data["pending"] = like is not None
        elif self.type == "band_invite":
            invite = BandInvite.query.filter_by(
                band_id=self.band_id, inviter_id=self.actor_id, invitee_id=self.user_id, status="pending"
            ).first()
            data["pending"] = invite is not None
            data["invite_id"] = invite.id if invite else None
        return data
