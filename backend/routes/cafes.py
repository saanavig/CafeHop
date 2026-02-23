from flask import Blueprint, request, jsonify, g
from routes.auth import require_auth, require_role
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

cafe_bp = Blueprint("cafe_bp", __name__)

# cafe registration for cafe owners
@cafe_bp.route("cafe/register", methods=["POST"])
@require_auth
@require_role("cafe_owner")
def register_cafe():
    data = request.get_json()

    owner_id = g.user["id"]

    try:
        # cafe onboarding
        cafe_response = supabase.table("cafes").insert({
            "owner_id": owner_id,
            "name": data["name"],
            "address": data.get("address"),
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "contact_email": data.get("contact_email"),
            "contact_phone": data.get("contact_phone"),
            "website_url": data.get("website_url"),
            "instagram_url": data.get("instagram_url"),
            "facebook_url": data.get("facebook_url"),
            "description": data.get("description"),
            "attributes": data.get("attributes"),
            "manual_tracking_enabled": data.get("manual_tracking_enabled", True)
        }).execute()

        if not cafe_response.data:
            return jsonify({"error": "Failed to create cafe"}), 500

        cafe = cafe_response.data[0]
        cafe_id = cafe["id"]

        # cafe hours
        hours = data.get("hours", [])
        for h in hours:
            supabase.table("cafe_hours").insert({
                "cafe_id": cafe_id,
                "day_of_week": h["day_of_week"],
                "open_time": h["open_time"],
                "close_time": h["close_time"]
            }).execute()

        # cafe reward system
        reward = data.get("reward")
        if reward:
            supabase.table("rewards").insert({
                "cafe_id": cafe_id,
                "title": reward["title"],
                "description": reward.get("description"),
                "points_required": reward["points_required"]
            }).execute()

        return jsonify({
            "message": "Cafe registered successfully",
            "cafe_id": cafe_id
        }), 201

    except Exception as e:
        print("Cafe registration error:", str(e))
        return jsonify({"error": "Internal server error"}), 500

# get cafes and info about them
@cafe_bp.route("/cafe/my-cafes", methods=["GET"])
@require_auth
@require_role("cafe_owner")
def get_my_cafes():
    owner_id = g.user["id"]

    try:
        # cafes from the owner
        cafes_response = supabase.table("cafes") \
            .select("*") \
            .eq("owner_id", owner_id) \
            .execute()

        cafes = cafes_response.data or []

        structured_response = []

        for cafe in cafes:
            cafe_id = cafe["id"]

            # get hours
            hours_response = supabase.table("cafe_hours") \
                .select("day_of_week, open_time, close_time") \
                .eq("cafe_id", cafe_id) \
                .execute()

            hours = hours_response.data or []

            # get rewards
            rewards_response = supabase.table("rewards") \
                .select("id, title, description, points_required, active") \
                .eq("cafe_id", cafe_id) \
                .execute()

            rewards = rewards_response.data or []

            structured_response.append({
                **cafe,
                "hours": hours,
                "rewards": rewards
            })

        return jsonify(structured_response), 200

    except Exception as e:
        print("Error fetching cafes:", str(e))
        return jsonify({"error": "Internal server error"}), 500