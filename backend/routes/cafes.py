from flask import Blueprint, request, jsonify, g
from routes.auth import require_auth, require_role
from supabase import create_client
from database.supabase_client import supabase, supabase_for_user
import os
from dotenv import load_dotenv
from datetime import datetime
import requests
from services.notification_service import create_notification

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
# SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

cafe_bp = Blueprint("cafe_bp", __name__)

# cafe registration for cafe owners
@cafe_bp.route("/cafe/register", methods=["POST"])
@require_auth
# @require_role("cafe_owner")
def register_cafe():
    data = request.get_json()

    if not data or "name" not in data:
        return jsonify({"error": "Cafe name is required"}), 400

    image_urls = data.get("image_urls", [])

    if not image_urls:
        return jsonify({"error": "At least one image is required"}), 400

    owner_id = g.user["id"]

    # upgrade user to cafe_owner if not already
    profile = supabase.table("profiles") \
        .select("role") \
        .eq("id", owner_id) \
        .execute()

    role = profile.data[0]["role"] if profile.data else None

    if role is None:
        # profile doesn't exist yet
        supabase.table("profiles").insert({
            "id": owner_id,
            "role": "cafe_owner"
        }).execute()

    elif role != "cafe_owner":
        # upgrade role
        supabase.table("profiles") \
            .update({"role": "cafe_owner"}) \
            .eq("id", owner_id) \
            .execute()

    try:

        email = g.user.get("email")

        if email:
            existing = supabase.table("cafes") \
                .select("id") \
                .eq("contact_email", email) \
                .execute()

            if existing.data:
                return jsonify({"error": "An account with this email already exists"}), 400

        price_map = {
            "$ (Budget-friendly)": 1,
            "$$ (Moderate)": 2,
            "$$$ (Premium)": 3,
        }


        # cafe onboarding
        cafe_response = supabase.table("cafes").insert({
            "owner_id": owner_id,
            "name": data["name"],
            "address": data.get("address"),
            # "image_url": data.get("image_url"),
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "price_level": price_map.get(data.get("price_range")),
            "contact_email": email,
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

        supabase.table("profiles").update({
            "full_name": cafe["name"]
        }).eq("id", owner_id).execute()
        cafe_id = cafe["id"]

        # insert images into cafe_images table
        image_rows = []

        for index, url in enumerate(image_urls):
            image_rows.append({
                "cafe_id": cafe_id,
                "image_path": url,
                "image_url": url,
                "is_cover": index == 0,
                "order_index": index
            })

        image_insert = supabase.table("cafe_images").insert(image_rows).execute()

        if not image_insert.data:
            return jsonify({"error": "Failed to save images"}), 500

        if image_urls:
            supabase.table("cafes").update({
                "image_url": image_urls[0]
            }).eq("id", cafe_id).execute()

        # cafe hours
        hours = data.get("hours", {})

        DAY_MAP = {
            "Sunday": 0,
            "Monday": 1,
            "Tuesday": 2,
            "Wednesday": 3,
            "Thursday": 4,
            "Friday": 5,
            "Saturday": 6,
        }

        hour_rows = []

        for day, val in hours.items():
            if not val.get("start") or not val.get("end"):
                continue

            hour_rows.append({
                "cafe_id": cafe_id,
                "day_of_week": DAY_MAP.get(day),
                "open_time": val.get("start"),
                "close_time": val.get("end"),
            })

        if hour_rows:
            supabase.table("cafe_hours").insert(hour_rows).execute()

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
        print("Cafe registration error:", e)
        return jsonify({"error": str(e)}), 500

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
                "rewards": rewards,
                "isOpen": is_cafe_open(hours) 
            })

        return jsonify(structured_response), 200

    except Exception as e:
        print("Error fetching cafes:", str(e))
        return jsonify({"error": "Internal server error"}), 500

@cafe_bp.route("/cafe/all", methods=["GET"])
def get_all_cafes():
    try:
        cafes_response = supabase.table("cafes").select("*").execute()
        cafes = cafes_response.data or []

        structured_response = []

        for cafe in cafes:
            cafe_id = cafe["id"]

            image_response = (
                supabase.table("cafe_images")
                .select("image_url")
                .eq("cafe_id", cafe_id)
                .eq("is_cover", True)
                .limit(1)
                .execute()
            )

            cover_image = (
                image_response.data[0]["image_url"]
                if image_response.data and len(image_response.data) > 0
                else None
            )

            # get hours
            hours_response = supabase.table("cafe_hours") \
                .select("day_of_week, open_time, close_time") \
                .eq("cafe_id", cafe_id) \
                .execute()

            hours = hours_response.data or []

            structured_response.append({
                **cafe,
                "hours": hours,
                "image_url": cover_image,
                "isOpen": is_cafe_open(hours)
            })

        return jsonify(structured_response), 200

    except Exception as e:
        print("Error fetching all cafes:", str(e))
        return jsonify({"error": "Internal server error"}), 500

def is_cafe_open(hours):
    now = datetime.now()
    day = (now.weekday() + 1) % 7  # Sunday = 0, Monday = 1
    current_time = now.strftime("%H:%M:%S")

    for h in hours:
        if h.get("day_of_week") != day:
            continue

        open_time = h.get("open_time")
        close_time = h.get("close_time")

        if not open_time or not close_time:
            continue

        if open_time <= current_time <= close_time:
            return True

    return False

# comments for cafe
@cafe_bp.route("/cafes/<cafe_id>/comments", methods=["GET"])
def get_comments(cafe_id):
    try:
        response = supabase.table("comments") \
            .select("id, content, created_at, user_id, profiles(first_name, full_name)") \
            .eq("cafe_id", cafe_id) \
            .order("created_at", desc=True) \
            .execute()

        comments = []
        for c in response.data or []:
            profile = c.get("profiles") or {}

            comments.append({
                "id": c.get("id"),
                "content": c.get("content"),
                "text": c.get("content"),
                "created_at": c.get("created_at"),
                "user_id": c.get("user_id"),
                "username": (
                    profile.get("first_name")
                    or profile.get("full_name")
                    or "User"
                ),
            })

        return jsonify(comments), 200

    except Exception as e:
        print("Error fetching comments:", str(e))
        return jsonify({"error": "Failed to fetch comments"}), 500


# comments for post
@cafe_bp.route("/posts/<post_id>/comments", methods=["GET"])
def get_comments_by_post(post_id):
    try:
        response = (
            supabase.table("comments")
            .select("id, content, created_at, user_id")
            .eq("post_id", post_id)
            .order("created_at", desc=True)
            .execute()
        )

        raw_comments = response.data or []

        comments = []

        for c in raw_comments:
            user_id = c.get("user_id")

            username = "User"

            try:
                profile_res = (
                    supabase.table("profiles")
                    .select("id, first_name, last_name, full_name")
                    .eq("id", user_id)
                    .maybe_single()
                    .execute()
                )

                profile = profile_res.data or {}

                username = (
                    profile.get("full_name")
                    or profile.get("first_name")
                    or "User"
                )

            except Exception as profile_error:
                print("PROFILE FETCH ERROR:", profile_error)

            comments.append({
                "id": c.get("id"),
                "content": c.get("content"),
                "text": c.get("content"),
                "created_at": c.get("created_at"),
                "user_id": user_id,
                "username": username,
            })

        return jsonify(comments), 200

    except Exception as e:
        print("Error fetching post comments:", str(e))
        return jsonify({"error": "Failed to fetch comments"}), 500

@cafe_bp.route("/cafes/<cafe_id>/comments", methods=["POST"])
@require_auth
def create_comment(cafe_id):
    data = request.get_json()
    user_id = g.user["id"]

    content = data.get("content")

    if not content or content.strip() == "":
        return jsonify({"error": "Comment cannot be empty"}), 400

    try:
        response = supabase.table("comments").insert({
            "cafe_id": cafe_id,
            "user_id": user_id,
            "content": content.strip()
        }).execute()

        # get cafe owner
        cafe_response = (
            supabase.table("cafes")
            .select("owner_id, name")
            .eq("id", cafe_id)
            .maybe_single()
            .execute()
        )

        if cafe_response.data:
            cafe_owner_id = cafe_response.data["owner_id"]
            cafe_name = cafe_response.data["name"]

            # avoid notifying yourself
            if cafe_owner_id != user_id:

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

                create_notification(
                    user_id=cafe_owner_id,
                    notif_type="new_review",
                    title="New comment 💬",
                    message=f"{customer_name} commented on {cafe_name}",
                )

        return jsonify(response.data[0]), 201

    except Exception as e:
        print("Error creating comment:", str(e))
        return jsonify({"error": "Failed to create comment"}), 500
    
@cafe_bp.route("/comments/<comment_id>", methods=["DELETE"])
@require_auth
def delete_comment(comment_id):
    user_id = g.user["id"]

    try:
        # Step 1: get comment
        comment_res = supabase.table("comments") \
            .select("*") \
            .eq("id", comment_id) \
            .execute()

        if not comment_res.data:
            return jsonify({"error": "Comment not found"}), 404

        comment = comment_res.data[0]
        comment_user_id = comment["user_id"]
        post_id = comment.get("post_id")

        # Step 2: determine cafe_id
        if post_id:
            # NEW SYSTEM → get cafe_id from post
            post_res = supabase.table("posts") \
                .select("cafe_id") \
                .eq("id", post_id) \
                .execute()

            if not post_res.data:
                return jsonify({"error": "Post not found"}), 404

            cafe_id = post_res.data[0]["cafe_id"]

        else:
            # OLD SYSTEM → fallback
            cafe_id = comment["cafe_id"]

        # Step 3: get cafe owner
        cafe_res = supabase.table("cafes") \
            .select("owner_id") \
            .eq("id", cafe_id) \
            .execute()

        if not cafe_res.data:
            return jsonify({"error": "Cafe not found"}), 404

        owner_id = cafe_res.data[0]["owner_id"]

        # Step 4: check authorization
        if user_id != comment_user_id and user_id != owner_id:
            return jsonify({"error": "Not authorized"}), 403

        # Step 5: delete
        supabase.table("comments") \
            .delete() \
            .eq("id", comment_id) \
            .execute()

        return jsonify({"message": "Comment deleted"}), 200

    except Exception as e:
        print("Error deleting comment:", str(e))
        return jsonify({"error": "Failed to delete comment"}), 500



@cafe_bp.route("/posts/<post_id>/comments", methods=["POST"])
@require_auth
def add_post_comment(post_id):
    try:
        print("CAFE COMMENT ROUTE RUNNING")

        user_id = g.user["id"]
        data = request.get_json(silent=True) or {}
        content = (data.get("content") or "").strip()

        if not content:
            return jsonify({"error": "Missing content"}), 400

        response = supabase.table("comments").insert({
            "post_id": post_id,
            "user_id": user_id,
            "content": content,
        }).execute()

        post_res = (
            supabase.table("posts")
            .select("comments_count")
            .eq("id", post_id)
            .maybe_single()
            .execute()
        )

        current_count = (post_res.data or {}).get("comments_count") or 0
        new_count = current_count + 1

        update_res = (
            supabase.table("posts")
            .update({"comments_count": new_count})
            .eq("id", post_id)
            .execute()
        )

        print("COMMENTS COUNT UPDATE:", update_res.data)

        profile = {}

        try:
            profile_res = (
                supabase.table("profiles")
                .select("first_name, last_name, full_name")
                .eq("id", user_id)
                .maybe_single()
                .execute()
            )

            if profile_res and profile_res.data:
                profile = profile_res.data

        except Exception as profile_error:
            print("PROFILE FETCH ERROR:", profile_error)

        comment = response.data[0]

        full_from_parts = (
            f"{profile.get('first_name') or ''} "
            f"{profile.get('last_name') or ''}"
        ).strip()

        formatted_comment = {
            "id": comment.get("id"),
            "content": comment.get("content"),
            "text": comment.get("content"),
            "created_at": comment.get("created_at"),
            "user_id": comment.get("user_id"),
            "username": (
                profile.get("full_name")
                or full_from_parts
                or profile.get("first_name")
                or "User"
            ),
        }

        return jsonify({
            "comment": formatted_comment,
            "comments_count": new_count,
        }), 201

    except Exception as e:
        print("COMMENT POST ERROR:", str(e))
        return jsonify({"error": "Failed to create comment"}), 500

# google address for autocomplete
@cafe_bp.route("/places/autocomplete", methods=["GET"])
def places_autocomplete():
    query = request.args.get("input")

    if not query:
        return jsonify({"error": "Missing input"}), 400

    try:
        res = requests.post(
            "https://places.googleapis.com/v1/places:autocomplete",
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": os.getenv("GOOGLE_PLACES_API_KEY"),
            },
            json={
                "input": query,
                "includedRegionCodes": ["us"]
            }
        )

        data = res.json()
        print("NEW API RESPONSE:", data)

        return jsonify(data)

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"error": str(e)}), 500

@cafe_bp.route("/places/details", methods=["GET"])
def place_details():
    place_id = request.args.get("place_id")

    if not place_id:
        return jsonify({"error": "Missing place_id"}), 400

    try:
        api_key = os.getenv("GOOGLE_PLACES_API_KEY")

        url = f"https://places.googleapis.com/v1/places/{place_id}"

        res = requests.get(
            url,
            headers={
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": "displayName,formattedAddress,location"
            }
        )

        if res.status_code != 200:
            return jsonify({"error": res.text}), 500

        return jsonify(res.json()), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@cafe_bp.route("/cafes/<cafe_id>", methods=["GET"])
def get_cafe_by_id(cafe_id):
    try:
        cafe_response = (
            supabase.table("cafes")
            .select("*")
            .eq("id", cafe_id)
            .maybe_single()
            .execute()
        )

        if not cafe_response.data:
            return jsonify({"error": "Cafe not found"}), 404

        cafe = cafe_response.data

        hours_response = (
            supabase.table("cafe_hours")
            .select("day_of_week, open_time, close_time")
            .eq("cafe_id", cafe_id)
            .execute()
        )

        hours = hours_response.data or []

        images_response = (
            supabase.table("cafe_images")
            .select("id, image_url, is_cover, order_index")
            .eq("cafe_id", cafe_id)
            .order("order_index")
            .execute()
        )

        images = images_response.data or []

        return jsonify({
            "cafe": {
                **cafe,
                "hours": hours,
                "images": images,
                "isOpen": is_cafe_open(hours),
            }
        }), 200

    except Exception as e:
        print("Error fetching cafe:", str(e))
        return jsonify({"error": "Internal server error"}), 500
    
@cafe_bp.route("/cafes/feed", methods=["GET"])
@require_auth
def get_cafes_feed():
    response = (
        supabase.table("cafes")
        .select("""
            id,
            name,
            address,
            latitude,
            longitude,
            description,
            active,
            posts(
                id,
                caption,
                likes_count,
                comments_count,
                created_at,
                post_media(
                    id,
                    file_url,
                    file_type
                )
            )
        """)
        .eq("active", True)
        .execute()
    )

    return jsonify({"cafes": response.data or []}), 200