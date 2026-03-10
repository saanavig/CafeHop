from flask import Blueprint, request, jsonify, g
from routes.auth import require_auth
from database.supabase_client import supabase
from datetime import datetime, timedelta
from datetime import timezone
import math

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

# purchase submission by users
@purchase_bp.route("/purchase/submit", methods=["POST"])
@require_auth
def submit_purchase():
    data = request.get_json()

    user_id = g.user["id"]
    cafe_id = data["cafe_id"]
    amount = float(data["amount"])
    user_lat = float(data["latitude"])
    user_lon = float(data["longitude"])
    submission_token = data["submission_token"]
    receipt_time = datetime.fromisoformat(
        data["receipt_timestamp"]
    ).replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)

    try:
        # get cafe
        cafe_response = supabase.table("cafes") \
            .select("latitude, longitude") \
            .eq("id", cafe_id) \
            .execute()

        if not cafe_response.data:
            return jsonify({"error": "Cafe not found"}), 400

        cafe = cafe_response.data[0]

        # check for distance <2
        distance = calculate_distance(
            user_lat, user_lon,
            float(cafe["latitude"]),
            float(cafe["longitude"])
        )

        if distance > 2:
            return jsonify({"error": "Outside 2-mile radius"}), 400

        if abs(now - receipt_time) > timedelta(minutes=60):
            return jsonify({"error": "Receipt older than 60 minutes"}), 400

        # max 2 reciepts per hour per user
        one_hour_ago = now - timedelta(hours=1)

        rate_limit_response = supabase.table("purchases") \
            .select("id") \
            .eq("user_id", user_id) \
            .eq("status", "approved") \
            .gte("created_at", one_hour_ago.isoformat()) \
            .execute()

        if len(rate_limit_response.data) >= 2:
            return jsonify({"error": "Rate limit exceeded (2 receipts per hour)"}), 400


        supabase.table("purchases").insert({
            "user_id": user_id,
            "cafe_id": cafe_id,
            "amount": amount,
            "latitude": user_lat,
            "longitude": user_lon,
            "receipt_timestamp": receipt_time.isoformat(),
            "submission_token": submission_token,
            "status": "approved"
        }).execute()

        # calculate points and update it
        points_earned = int(amount)
        current = supabase.table("user_points") \
            .select("total_points") \
            .eq("user_id", user_id) \
            .execute()

        current_points = current.data[0]["total_points"]

        supabase.table("user_points").update({
            "total_points": current_points + points_earned
        }).eq("user_id", user_id).execute()

        return jsonify({
            "message": "Purchase approved",
            "points_earned": points_earned
        }), 200

    except Exception as e:
        print("Purchase error:", str(e))
        return jsonify({"error": "Submission failed"}), 500

# redeem points
@purchase_bp.route("/redeem", methods=["POST"])
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

        return jsonify({
            "message": "Redemption successful",
            "points_redeemed": points_to_redeem,
            "remaining_points": new_balance
        }), 200

    except Exception as e:
        print("Redemption error:", str(e))
        return jsonify({"error": "Redemption failed"}), 500