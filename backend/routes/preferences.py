from flask import Blueprint, jsonify, request, g as flask_g
from database.auth_middleware import require_auth
from services.preference_service import (
    get_user_preferences,
    upsert_user_preferences,
    get_user_preference_tags,
    replace_user_preference_tags,
)

preferences_bp = Blueprint("preferences", __name__)


def _get_user_id_from_request():
    return flask_g.user["id"]


@preferences_bp.route("/users/preferences", methods=["GET"])
@require_auth
def fetch_my_preferences():
    user_id = _get_user_id_from_request()
    prefs = get_user_preferences(user_id)
    return jsonify({"preferences": prefs}), 200


@preferences_bp.route("/users/preferences", methods=["PUT"])
@require_auth
def update_my_preferences():
    user_id = _get_user_id_from_request()
    body = request.get_json(silent=True) or {}

    updated = upsert_user_preferences(user_id, body)
    return jsonify({
        "message": "Preferences updated",
        "preferences": updated
    }), 200


@preferences_bp.route("/users/preference-tags", methods=["GET"])
@require_auth
def fetch_my_preference_tags():
    user_id = _get_user_id_from_request()
    tags = get_user_preference_tags(user_id)
    return jsonify({"tags": tags}), 200


@preferences_bp.route("/users/preference-tags", methods=["PUT"])
@require_auth
def update_my_preference_tags():
    user_id = _get_user_id_from_request()
    body = request.get_json(silent=True) or {}
    tag_ids = body.get("tag_ids", [])

    if not isinstance(tag_ids, list):
        return jsonify({"error": "tag_ids must be a list"}), 400

    updated = replace_user_preference_tags(user_id, tag_ids)
    return jsonify({
        "message": "Preference tags updated",
        "data": updated
    }), 200