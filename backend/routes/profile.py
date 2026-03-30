from flask import Blueprint, request, jsonify, g
from routes.auth import require_auth
from database.supabase_client import supabase_admin as supabase
from services.purchase_repo import get_user_points
from datetime import datetime, timedelta
from datetime import timezone

profile_bp = Blueprint("profile_bp", __name__)



@profile_bp.route("/users/me/name", methods=["GET"])
@require_auth
def get_user_name():
    user_id = g.user.get("id")

    if not user_id:
        return jsonify({"name": ""}), 401

    response = (
        supabase.table("profiles")
        .select("first_name", "last_name")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )

    if not response or not getattr(response, "data", None):
        return jsonify({"name": ""}), 200

    first = response.data[0].get("first_name") or ""
    last = response.data[0].get("last_name") or ""
    full = f"{first} {last}".strip()

    return jsonify({"name": full}), 200

@profile_bp.route("/users/me/name", methods=["PUT"])
@require_auth
def update_user_name():
    user_id = g.user.get("id")

    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    body = request.get_json(silent=True) or {}
    first_name = (body.get("first_name") or "").strip()
    last_name = (body.get("last_name") or "").strip()

    if not first_name and not last_name:
        return jsonify({
            "error": "At least one of first_name or last_name must be provided"
        }), 400

    try:
        response = (
            supabase.table("profiles")
            .upsert(
                {
                    "id": user_id,
                    "first_name": first_name,
                    "last_name": last_name,
                }
            )
            .execute()
        )

        updated_profile = response.data[0] if response.data else {
            "id": user_id,
            "first_name": first_name,
            "last_name": last_name,
        }

        return jsonify({
            "message": "Name updated successfully",
            "profile": updated_profile,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500