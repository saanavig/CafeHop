from flask import Blueprint, jsonify, g, request
from routes.auth import require_auth, require_role
from services.purchase_repo import get_user_points, get_user_points_history
from database.supabase_client import supabase_admin as supabase

rewards_bp = Blueprint("rewards_bp", __name__)

# user points
@rewards_bp.route("/users/<user_id>/points", methods=["GET"])
def user_points(user_id):

    print("user_id received:", user_id)

    points = get_user_points(user_id)

    return jsonify({
        "user_id": user_id,
        "points": points
    }), 200

# user point history
@rewards_bp.route("/users/<user_id>/points/history", methods=["GET"])
def user_points_history(user_id):

    history = get_user_points_history(user_id)

    return jsonify({
        "user_id": user_id,
        "history": history
    }), 200

# reward setup for cafes
@rewards_bp.route("/cafes/<cafe_id>/rewards", methods=["POST"])
@require_auth
@require_role("cafe_owner")
def create_reward(cafe_id):

    data = request.get_json()

    if not data or "title" not in data or "points_required" not in data:
        return jsonify({"error": "title and points_required required"}), 400

    try:
        cafe = supabase.table("cafes") \
            .select("owner_id") \
            .eq("id", cafe_id) \
            .execute()

        if not cafe.data or cafe.data[0]["owner_id"] != g.user["id"]:
            return jsonify({"error": "Forbidden"}), 403

        # create reward
        response = supabase.table("rewards").insert({
            "cafe_id": cafe_id,
            "title": data["title"],
            "description": data.get("description"),
            "points_required": data["points_required"],
            "active": True
        }).execute()

        return jsonify({
            "message": "Reward created",
            "reward": response.data[0]
        }), 201

    except Exception as e:
        print("Reward creation error:", e)
        return jsonify({"error": "Internal server error"}), 500