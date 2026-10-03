from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from extensions import db, socketio
from helpers import current_user_id, error, find_friendship, notify
from models import Band, BandInvite, BandMember, BandMessage

bp = Blueprint("bands", __name__, url_prefix="/api/bands")


def find_member(band, user_id):
    return next((member for member in band.members if member.user_id == user_id), None)


def member_band(band_id, user_id):
    band = db.session.get(Band, band_id)
    if not band or not find_member(band, user_id):
        return None
    return band


@bp.get("")
@jwt_required()
def my_bands():
    bands = (
        Band.query.join(BandMember)
        .filter(BandMember.user_id == current_user_id())
        .order_by(Band.name)
        .all()
    )
    return {"bands": [band.to_dict() for band in bands]}


@bp.post("")
@jwt_required()
def create_band():
    me_id = current_user_id()
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    description = str(data.get("description", "")).strip()
    if not name or len(name) > 80:
        return error("The band name is required (max 80 characters).")
    if len(description) > 300:
        return error("The description can have at most 300 characters.")

    band = Band(name=name, description=description, owner_id=me_id)
    band.members.append(BandMember(user_id=me_id))
    db.session.add(band)
    db.session.commit()
    return band.to_dict(), 201


@bp.get("/<int:band_id>")
@jwt_required()
def band_detail(band_id):
    band = member_band(band_id, current_user_id())
    if not band:
        return error("Band not found.", 404)
    return band.to_dict(detail=True)


@bp.post("/<int:band_id>/invite")
@jwt_required()
def invite(band_id):
    me_id = current_user_id()
    band = member_band(band_id, me_id)
    if not band:
        return error("Band not found.", 404)

    user_id = (request.get_json(silent=True) or {}).get("user_id")
    if not isinstance(user_id, int) or not find_friendship(me_id, user_id):
        return error("You can only invite your friends.")
    if find_member(band, user_id):
        return error("This musician is already in the band.")
    if BandInvite.query.filter_by(band_id=band_id, invitee_id=user_id, status="pending").first():
        return error("This musician already has a pending invite.")

    db.session.add(BandInvite(band_id=band_id, inviter_id=me_id, invitee_id=user_id))
    db.session.commit()
    notify(user_id, "band_invite", me_id, band_id)
    return {"ok": True}, 201


def answer_invite(invite_id, accept):
    me_id = current_user_id()
    invite = db.session.get(BandInvite, invite_id)
    if not invite or invite.invitee_id != me_id or invite.status != "pending":
        return error("This invite is no longer pending.", 404)

    invite.status = "accepted" if accept else "declined"
    band = db.session.get(Band, invite.band_id)
    if accept and not find_member(band, me_id):
        band.members.append(BandMember(user_id=me_id))
    db.session.commit()

    if accept:
        for member in band.members:
            if member.user_id != me_id:
                notify(member.user_id, "band_join", me_id, band.id)
    return {"ok": True, "band_id": band.id}


@bp.post("/invites/<int:invite_id>/accept")
@jwt_required()
def accept_invite(invite_id):
    return answer_invite(invite_id, True)


@bp.post("/invites/<int:invite_id>/decline")
@jwt_required()
def decline_invite(invite_id):
    return answer_invite(invite_id, False)


@bp.post("/<int:band_id>/leave")
@jwt_required()
def leave_band(band_id):
    me_id = current_user_id()
    band = member_band(band_id, me_id)
    if not band:
        return error("Band not found.", 404)

    remaining = [member for member in band.members if member.user_id != me_id]
    if not remaining:
        db.session.delete(band)
    else:
        band.members.remove(find_member(band, me_id))
        if band.owner_id == me_id:
            band.owner_id = remaining[0].user_id
    db.session.commit()
    return {"ok": True}


@bp.delete("/<int:band_id>")
@jwt_required()
def delete_band(band_id):
    me_id = current_user_id()
    band = member_band(band_id, me_id)
    if not band:
        return error("Band not found.", 404)
    if band.owner_id != me_id:
        return error("Only the band owner can delete it.", 403)

    db.session.delete(band)
    db.session.commit()
    return {"ok": True}


@bp.delete("/<int:band_id>/members/<int:user_id>")
@jwt_required()
def remove_member(band_id, user_id):
    me_id = current_user_id()
    band = member_band(band_id, me_id)
    if not band:
        return error("Band not found.", 404)
    if band.owner_id != me_id:
        return error("Only the band owner can remove members.", 403)
    member = find_member(band, user_id)
    if not member or user_id == me_id:
        return error("Member not found.", 404)

    band.members.remove(member)
    db.session.commit()
    return {"ok": True}


@bp.get("/<int:band_id>/messages")
@jwt_required()
def get_messages(band_id):
    if not member_band(band_id, current_user_id()):
        return error("Band not found.", 404)

    messages = (
        BandMessage.query.filter_by(band_id=band_id)
        .order_by(BandMessage.created_at, BandMessage.id)
        .all()
    )
    return {"messages": [message.to_dict() for message in messages]}


@bp.post("/<int:band_id>/messages")
@jwt_required()
def send_message(band_id):
    me_id = current_user_id()
    band = member_band(band_id, me_id)
    if not band:
        return error("Band not found.", 404)

    content = str((request.get_json(silent=True) or {}).get("content", "")).strip()
    if not content or len(content) > 1000:
        return error("Messages must have between 1 and 1000 characters.")

    message = BandMessage(band_id=band_id, sender_id=me_id, content=content)
    db.session.add(message)
    db.session.commit()

    payload = message.to_dict()
    for member in band.members:
        socketio.emit("band_message", payload, to=f"user_{member.user_id}")
    return payload, 201
