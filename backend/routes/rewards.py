from flask import Blueprint, jsonify, g, request
from routes.auth import require_auth, require_role
from services.purchase_repo import get_user_points, get_user_points_history
from database.supabase_client import supabase_admin as supabase
import time
from datetime import datetime, timedelta, timezone
import traceback

rewards_bp = Blueprint("rewards_bp", __name__)

@rewards_bp.route("/users/me/points", methods=["GET"])
@require_auth
def user_points():
    user_id = g.user["id"]

    points = get_user_points(user_id)

    return jsonify({
        "user_id": user_id,
        "points": points
    }), 200

@rewards_bp.route("/users/me/points/history", methods=["GET"])
@require_auth
def user_points_history():
    user_id = g.user["id"]

    history = get_points_activity(user_id)

    return jsonify({
        "user_id": user_id,
        "history": history
    }), 200

@rewards_bp.route("/cafes/<cafe_id>/rewards", methods=["POST"])
@require_auth
@require_role("cafe_owner")
def create_reward(cafe_id):
    data = request.get_json()

    if (
        not data
        or not isinstance(data.get("title"), str)
        or not data.get("title").strip()
        or not isinstance(data.get("points_required"), int)
        or data["points_required"] <= 0
    ):
        return jsonify({"error": "Invalid input"}), 400

    try:
        cafe = supabase.table("cafes") \
            .select("owner_id") \
            .eq("id", cafe_id) \
            .execute()

        if not cafe.data or cafe.data[0]["owner_id"] != g.user["id"]:
            return jsonify({"error": "Forbidden"}), 403

        response = supabase.table("rewards").insert({
            "cafe_id": cafe_id,
            "title": data["title"],
            "description": data.get("description"),
            "points_required": data["points_required"],
            "active": True
        }).execute()

        reward = response.data[0] if response.data else None

        return jsonify({
            "message": "Reward created",
            "reward": reward
        }), 201

    except Exception as e:
        print("Reward creation error:", e)
        return jsonify({"error": "Internal server error"}), 500

@rewards_bp.route("/cafes/<cafe_id>/rewards", methods=["GET"])
@require_auth
def get_rewards_for_cafe(cafe_id):
    try:
        response = supabase.table("rewards") \
            .select("id, title, description, points_required, active") \
            .eq("cafe_id", cafe_id) \
            .eq("active", True) \
            .order("points_required") \
            .execute()

        return jsonify({
            "rewards": response.data or []
        }), 200

    except Exception as e:
        print("Fetch rewards error:", e)
        return jsonify({"error": "Internal server error"}), 500

@rewards_bp.route("/redeem", methods=["POST"])
@require_auth
def redeem_reward():
    data = request.get_json(silent=True) or {}
    user_id = g.user["id"]

    print("REDEEM DATA:", data)

    if not data:
        return jsonify({"error": "Invalid request body"}), 400

    submission_token = data.get("submission_token")

    timestamp = data.get("timestamp")

    if not isinstance(timestamp, (int, float)):
        return jsonify({"error": "Invalid timestamp"}), 400

    if abs(time.time() * 1000 - timestamp) > 60000:
        return jsonify({"error": "QR expired"}), 400

    if not submission_token:
        return jsonify({"error": "Missing submission_token"}), 400

    existing = supabase.table("point_transactions") \
        .select("id") \
        .eq("submission_token", submission_token) \
        .execute()

    if existing.data:
        return jsonify({"error": "Duplicate redemption"}), 400

    reward_id = data.get("reward_id")
    cafe_id = data.get("cafe_id")

    if not reward_id or not cafe_id:
        return jsonify({"error": "Missing data"}), 400

    if not isinstance(reward_id, str) or not isinstance(cafe_id, str):
        return jsonify({"error": "Invalid IDs"}), 400

    try:
        reward = supabase.table("rewards") \
            .select("points_required, cafe_id, active, title") \
            .eq("id", reward_id) \
            .execute()

        print("REWARD RAW:", reward)

        if not reward.data:
            return jsonify({"error": "Reward not found"}), 400

        reward_data = reward.data[0]

        if (
            not reward_data["active"]
            or reward_data["cafe_id"] != cafe_id
        ):
            return jsonify({"error": "Invalid reward for this cafe"}), 400

        points_needed = reward.data[0]["points_required"]
        current_points = get_user_points(user_id)

        if current_points < points_needed:
            return jsonify({"error": "Not enough points"}), 400


        # Deduct points
        supabase.table("point_transactions").insert({
            "user_id": user_id,
            "cafe_id": cafe_id,
            "points_change": -points_needed,
            "reason": f"Redeemed: {reward_data.get('title', 'Reward')}",
            "submission_token": submission_token
        }).execute()

        supabase.table("reward_redemptions").insert({
            "user_id": user_id,
            "reward_id": reward_id,
            "cafe_id": cafe_id,
            "points_spent": points_needed,
            "status": "completed",
        }).execute()

        remaining_points = get_user_points(user_id)

        return jsonify({
            "message": "Redeemed successfully",
            "remaining_points": remaining_points,
            "points_spent": points_needed
        }), 200

    except Exception as e:
        print("Redeem error:", e)
        return jsonify({"error": "Internal error"}), 500
    
def get_points_activity(user_id: str):
    res = supabase.table("point_transactions") \
        .select("points_change, reason, created_at") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .execute()

    if not res.data:
        return []

    return [
        {
            "points": t["points_change"],
            "reason": t["reason"],
            "date": t["created_at"],
            "type": "earn" if t["points_change"] > 0 else "redeem",
            "display": f"{'+' if t['points_change'] > 0 else ''}{t['points_change']} pts"
        }
        for t in res.data
    ]

@rewards_bp.route("/cafes/<cafe_id>/analytics", methods=["GET"])
@require_auth
@require_role("cafe_owner")
def cafe_analytics(cafe_id):
    try:
        # Verify ownership
        cafe = supabase.table("cafes") \
            .select("owner_id") \
            .eq("id", cafe_id) \
            .execute()

        if not cafe.data or cafe.data[0]["owner_id"] != g.user["id"]:
            return jsonify({"error": "Forbidden"}), 403

        issued = supabase.table("point_transactions") \
            .select("points_change") \
            .gt("points_change", 0) \
            .eq("cafe_id", cafe_id) \
            .execute()

        total_issued = sum(
            t["points_change"] for t in (issued.data or [])
        )

        redemptions = supabase.table("reward_redemptions") \
            .select("id", count="exact") \
            .eq("cafe_id", cafe_id) \
            .execute()

        total_redemptions = redemptions.count or 0

        # Active users today
        today_start = (
            datetime.now(timezone.utc) - timedelta(days=1)
        ).isoformat()

        active_today = supabase.table("point_transactions") \
            .select("user_id") \
            .eq("cafe_id", cafe_id) \
            .gte("created_at", today_start) \
            .execute()

        unique_users = len(set(
            t["user_id"] for t in (active_today.data or [])
        ))

        return jsonify({
            "points_issued": total_issued,
            "redemptions": total_redemptions,
            "active_today": unique_users
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@rewards_bp.route("/cafes/<cafe_id>/recent-redemptions", methods=["GET"])
@require_auth
@require_role("cafe_owner")
def recent_redemptions(cafe_id):
    try:
        cafe = supabase.table("cafes") \
            .select("owner_id") \
            .eq("id", cafe_id) \
            .execute()

        if not cafe.data or cafe.data[0]["owner_id"] != g.user["id"]:
            return jsonify({"error": "Forbidden"}), 403

        response = supabase.table("reward_redemptions") \
            .select("""
                points_spent,
                created_at,
                rewards(title),
                profiles(full_name)
            """) \
            .eq("cafe_id", cafe_id) \
            .order("created_at", desc=True) \
            .limit(10) \
            .execute()

        formatted = []

        for r in response.data or []:
            formatted.append({
                "customer": r.get("profiles", {}).get("full_name", "Customer"),
                "reward": r.get("rewards", {}).get("title", "Reward"),
                "points": r.get("points_spent", 0),
                "time": datetime.fromisoformat(
                    r.get("created_at").replace("Z", "+00:00")
                ).strftime("%b %d, %Y")
            })

        return jsonify({
            "redemptions": formatted
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@rewards_bp.route("/cafes/<cafe_id>/owner/rewards", methods=["GET"])
@require_auth
@require_role("cafe_owner")
def owner_rewards(cafe_id):
    try:
        cafe = supabase.table("cafes") \
            .select("owner_id") \
            .eq("id", cafe_id) \
            .execute()

        if not cafe.data or cafe.data[0]["owner_id"] != g.user["id"]:
            return jsonify({"error": "Forbidden"}), 403

        rewards = supabase.table("rewards") \
            .select("*") \
            .eq("cafe_id", cafe_id) \
            .order("created_at", desc=True) \
            .execute()

        return jsonify({
            "rewards": rewards.data or []
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@rewards_bp.route("/rewards/<reward_id>", methods=["PATCH"])
@require_auth
@require_role("cafe_owner")
def update_reward(reward_id):
    try:
        data = request.get_json() or {}

        update_payload = {}

        if "active" in data:
            if not isinstance(data["active"], bool):
                return jsonify({"error": "Invalid active value"}), 400

            update_payload["active"] = data["active"]

        if "title" in data:
            if not isinstance(data["title"], str) or not data["title"].strip():
                return jsonify({"error": "Invalid title"}), 400

            update_payload["title"] = data["title"].strip()

        if "description" in data:
            update_payload["description"] = data["description"]

        if "points_required" in data:
            if (
                not isinstance(data["points_required"], int)
                or data["points_required"] <= 0
            ):
                return jsonify({"error": "Invalid points"}), 400

            update_payload["points_required"] = data["points_required"]

        if not update_payload:
            return jsonify({"error": "No valid fields"}), 400

        reward = supabase.table("rewards") \
            .select("id, cafe_id") \
            .eq("id", reward_id) \
            .execute()

        if not reward.data:
            return jsonify({"error": "Reward not found"}), 404

        cafe_id = reward.data[0]["cafe_id"]

        cafe = supabase.table("cafes") \
            .select("owner_id") \
            .eq("id", cafe_id) \
            .execute()

        if not cafe.data or cafe.data[0]["owner_id"] != g.user["id"]:
            return jsonify({"error": "Forbidden"}), 403

        updated = supabase.table("rewards") \
            .update(update_payload) \
            .eq("id", reward_id) \
            .execute()

        return jsonify({
            "message": "Reward updated",
            "reward": updated.data[0] if updated.data else None
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
@rewards_bp.route("/rewards/<reward_id>", methods=["DELETE"])
@require_auth
@require_role("cafe_owner")
def delete_reward(reward_id):
    try:
        reward = supabase.table("rewards") \
            .select("id, cafe_id") \
            .eq("id", reward_id) \
            .execute()

        if not reward.data:
            return jsonify({"error": "Reward not found"}), 404

        cafe_id = reward.data[0]["cafe_id"]

        cafe = supabase.table("cafes") \
            .select("owner_id") \
            .eq("id", cafe_id) \
            .execute()

        if not cafe.data or cafe.data[0]["owner_id"] != g.user["id"]:
            return jsonify({"error": "Forbidden"}), 403

        supabase.table("rewards") \
            .delete() \
            .eq("id", reward_id) \
            .execute()

        return jsonify({
            "message": "Reward deleted"
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500