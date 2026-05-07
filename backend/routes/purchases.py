from flask import Blueprint, request, jsonify, g
from routes.auth import require_auth
from database.supabase_client import supabase_admin as supabase
from services.purchase_repo import get_user_points
from datetime import datetime, timedelta
from datetime import timezone
import math
from services.notification_service import create_notification

purchase_bp = Blueprint("purchase_bp", __name__)

# distace < 2 miles from the cafe
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 3958.8
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# redeem points
@purchase_bp.route("/points/redeem", methods=["POST"])
@require_auth
def redeem_points():
    data = request.get_json()

    user_id = g.user["id"]
    cafe_id = data["cafe_id"]
    points_to_redeem = int(data["points"])

    try:
        # check min points
        if points_to_redeem <= 0:
            return jsonify({"error": "Invalid redemption amount"}), 400

        # chec user balance
        balance_response = supabase.table("user_points") \
            .select("total_points") \
            .eq("user_id", user_id) \
            .execute()

        if not balance_response.data:
            return jsonify({"error": "User points record not found"}), 400

        current_points = balance_response.data[0]["total_points"]

        if current_points < points_to_redeem:
            return jsonify({"error": "Insufficient points"}), 400

        # check user has visited this cafe at least once
        visit_response = supabase.table("purchases") \
            .select("id") \
            .eq("user_id", user_id) \
            .eq("cafe_id", cafe_id) \
            .eq("status", "approved") \
            .limit(1) \
            .execute()

        if not visit_response.data:
            return jsonify({"error": "Must visit cafe before redeeming"}), 400

        # remove redeemed points
        new_balance = current_points - points_to_redeem

        supabase.table("user_points").update({
            "total_points": new_balance
        }).eq("user_id", user_id).execute()

        # get cafe info
        cafe_response = (
            supabase.table("cafes")
            .select("owner_id, name")
            .eq("id", cafe_id)
            .maybe_single()
            .execute()
        )

        cafe_name = "Cafe"
        cafe_owner_id = None

        if cafe_response.data:
            cafe_name = cafe_response.data["name"]
            cafe_owner_id = cafe_response.data["owner_id"]

        # get customer name
        profile_response = (
            supabase.table("profiles")
            .select("full_name")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )

        customer_name = (
            profile_response.data["full_name"]
            if profile_response.data
            else "Someone"
        )

        # customer notification
        create_notification(
            user_id=user_id,
            notif_type="reward_redeemed",
            title="Reward redeemed 🎉",
            message=f"You redeemed {points_to_redeem} points at {cafe_name}",
        )

        # cafe owner notification
        if cafe_owner_id and cafe_owner_id != user_id:

            create_notification(
                user_id=cafe_owner_id,
                notif_type="reward_redeemed",
                title="Reward redeemed",
                message=f"{customer_name} redeemed {points_to_redeem} points",
            )

        return jsonify({
            "message": "Redemption successful",
            "points_redeemed": points_to_redeem,
            "remaining_points": new_balance
        }), 200

    except Exception as e:
        print("Redemption error:", str(e))
        return jsonify({"error": "Redemption failed"}), 500

# purchase to loyalty points
@purchase_bp.route("/users/me/points", methods=["GET"])
@require_auth
def get_points():
    user_id = g.user["id"]

    total_points = get_user_points(user_id)

    return jsonify({
        "points": total_points
    }), 200