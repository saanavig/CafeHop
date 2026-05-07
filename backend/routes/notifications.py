from flask import Blueprint, jsonify, g
from routes.auth import require_auth
from database.supabase_client import supabase_admin as supabase

notifications_bp = Blueprint("notifications_bp", __name__)

@notifications_bp.route("/notifications", methods=["GET"])
@require_auth
def get_notifications():

    user_id = g.user["id"]

    response = (
        supabase.table("notifications")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    return jsonify(response.data), 200

@notifications_bp.route("/notifications/<notif_id>/read", methods=["PATCH"])
@require_auth
def mark_notification_read(notif_id):

    response = (
        supabase.table("notifications")
        .update({"is_read": True})
        .eq("id", notif_id)
        .execute()
    )

    return jsonify({"success": True}), 200