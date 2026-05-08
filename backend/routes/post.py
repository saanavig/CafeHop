from flask import Blueprint, jsonify, request, g
from database.auth_middleware import require_auth
from services.post_service import create_post_with_uploaded_media
from database.supabase_client import supabase,  supabase_for_user
from services.notification_service import create_notification

posts_bp = Blueprint("posts", __name__)

@posts_bp.route("/posts/me", methods=["GET"])
@require_auth
def get_my_posts():
    user_id = g.user["id"]
    access_token = g.access_token

    from services.post_service import get_posts_by_user

    posts = get_posts_by_user(access_token, user_id)


    return jsonify(posts), 200

@posts_bp.route("/posts", methods=["POST"])
@require_auth
def upload_post():
    user_id = g.user["id"]
    access_token = g.access_token

    data = request.get_json()
    print("REQUEST DATA:", data)

    cafe_id = data.get("cafe_id")
    caption = data.get("caption", "")
    post_type = data.get("post_type", "user")
    media_list = data.get("media", [])

    print("MEDIA LIST:", media_list) 

    if not cafe_id or not media_list:
        return jsonify({"error": "Missing required fields"}), 400

    from services.post_service import create_post, create_post_media

    post = create_post(
        access_token=access_token,
        user_id=user_id,
        cafe_id=cafe_id,
        caption=caption,
        post_type=post_type
    )

    print("POST CREATED:", post) 

    media_results = []
    for m in media_list:
        print("PROCESSING MEDIA:", m) 
        media = create_post_media(
            access_token=access_token,
            post_id=post["id"],
            bucket_name=m["bucket_name"],
            file_path=m["file_path"],
            file_url=m["file_url"],
            file_type=m["file_type"],
        )
        media_results.append(media)

    return jsonify({
        "message": "Post created",
        "post": post,
        "media": media_results
    }), 201

@posts_bp.route("/posts/<post_id>", methods=["DELETE"])
@require_auth
def delete_post(post_id):
    user_id = g.user["id"]
    access_token = g.access_token

    try:
        from database.supabase_client import supabase_for_user
        user_supabase = supabase_for_user(access_token)

        post = user_supabase.table("posts") \
            .select("id") \
            .eq("id", post_id) \
            .eq("user_id", user_id) \
            .maybe_single() \
            .execute()

        if not post.data:
            return jsonify({"error": "Post not found or unauthorized"}), 404

        # delete media first (important for FK)
        user_supabase.table("post_media") \
            .delete() \
            .eq("post_id", post_id) \
            .execute()

        # delete post
        user_supabase.table("posts") \
            .delete() \
            .eq("id", post_id) \
            .execute()

        return jsonify({"message": "Post deleted"}), 200

    except Exception as e:
        print("DELETE ERROR:", e)
        return jsonify({"error": str(e)}), 500


@posts_bp.route("/posts/<post_id>/like", methods=["POST"])
@require_auth
def like_post(post_id):
    user_id = g.user["id"]

    try:
        existing = (
            supabase.table("post_likes")
            .select("id")
            .eq("post_id", post_id)
            .eq("user_id", user_id)
            .execute()
        )

        existing_rows = existing.data if existing and existing.data else []

        if not existing_rows:
            supabase.table("post_likes").insert({
                "post_id": post_id,
                "user_id": user_id,
            }).execute()

        likes_res = (
            supabase.table("post_likes")
            .select("id")
            .eq("post_id", post_id)
            .execute()
        )

        likes_count = len(likes_res.data or [])

        supabase.table("posts").update({
            "likes_count": likes_count
        }).eq("id", post_id).execute()

        return jsonify({
            "message": "Liked",
            "liked_by_user": True,
            "likes_count": likes_count,
        }), 200

    except Exception as e:
        print("LIKE POST ERROR:", e)
        return jsonify({"error": str(e)}), 500


@posts_bp.route("/posts/<post_id>/like", methods=["DELETE"])
@require_auth
def unlike_post(post_id):
    user_id = g.user["id"]

    try:
        supabase.table("post_likes") \
            .delete() \
            .eq("post_id", post_id) \
            .eq("user_id", user_id) \
            .execute()

        likes_res = (
            supabase.table("post_likes")
            .select("id")
            .eq("post_id", post_id)
            .execute()
        )

        likes_count = len(likes_res.data or [])

        supabase.table("posts").update({
            "likes_count": likes_count
        }).eq("id", post_id).execute()

        return jsonify({
            "message": "Unliked",
            "liked_by_user": False,
            "likes_count": likes_count,
        }), 200

    except Exception as e:
        print("UNLIKE POST ERROR:", e)
        return jsonify({"error": str(e)}), 500

@posts_bp.route("/posts/<post_id>/save", methods=["POST"])
@require_auth
def save_post(post_id):
    user_id = g.user["id"]
    user_supabase = supabase_for_user(g.access_token)
    existing = (
        user_supabase.table("post_saves")
        .select("id")
        .eq("post_id", post_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if existing.data:
        return jsonify({"message": "Already saved"}), 200

    user_supabase.table("post_saves").insert({
        "post_id": post_id,
        "user_id": user_id
    }).execute()

    return jsonify({"message": "Saved"}), 201

@posts_bp.route("/posts/<post_id>/save", methods=["DELETE"])
@require_auth
def unsave_post(post_id):
    user_id = g.user["id"]
    user_supabase = supabase_for_user(g.access_token)

    user_supabase.table("post_saves") \
        .delete() \
        .eq("post_id", post_id) \
        .eq("user_id", user_id) \
        .execute()

    return jsonify({"message": "Unsaved"}), 200

@posts_bp.route("/posts/<post_id>/comments", methods=["GET"])
@require_auth
def get_post_comments(post_id):
    user_supabase = supabase_for_user(g.access_token)

    response = (
        user_supabase.table("comments")
        .select("id, content, user_id, created_at, profiles(first_name)")
        .eq("post_id", post_id)
        .order("created_at", desc=True)
        .execute()
    )

    comments = [
        {
            "id": c["id"],
            "content": c["content"],
            "user_id": c["user_id"],
            "username": (c.get("profiles") or {}).get("first_name") or "User",
            "created_at": c.get("created_at"),
        }
        for c in (response.data or [])
    ]

    return jsonify(comments), 200

@posts_bp.route("/posts/<post_id>/comments", methods=["POST"])
@require_auth
def add_post_comment(post_id):
    user_id = g.user["id"]
    data = request.get_json(silent=True) or {}
    user_supabase = supabase_for_user(g.access_token)

    content = (data.get("content") or "").strip()

    if not content:
        return jsonify({"error": "Missing content"}), 400

    response = user_supabase.table("comments").insert({
        "post_id": post_id,
        "user_id": user_id,
        "content": content,
    }).execute()

    post = (
        user_supabase.table("posts")
        .select("comments_count")
        .eq("id", post_id)
        .maybe_single()
        .execute()
    )

    current = (post.data or {}).get("comments_count") or 0

    user_supabase.table("posts").update({
        "comments_count": current + 1
    }).eq("id", post_id).execute()

    # get post cafe
    post_details = (
        user_supabase.table("posts")
        .select("cafe_id")
        .eq("id", post_id)
        .maybe_single()
        .execute()
    )

    if post_details.data:

        cafe_id = post_details.data["cafe_id"]

        cafe_response = (
            user_supabase.table("cafes")
            .select("owner_id, name")
            .eq("id", cafe_id)
            .maybe_single()
            .execute()
        )

        if cafe_response.data:

            cafe_owner_id = cafe_response.data["owner_id"]
            cafe_name = cafe_response.data["name"]

            # don't notify yourself
            if cafe_owner_id != user_id:

                profile_response = (
                    user_supabase.table("profiles")
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
                    message=f"{customer_name} commented on a post from {cafe_name}",
                )

    return jsonify({
        "comment": response.data[0],
        "comments_count": current + 1,
    }), 201

@posts_bp.route("/posts/feed", methods=["GET"])
@require_auth
def get_posts_feed_route():
    try:
        user_id = g.user["id"]
        user_supabase = supabase_for_user(g.access_token)

        response = (
            user_supabase.table("posts")
            .select("""
                id,
                user_id,
                cafe_id,
                author_id,
                author_type,
                caption,
                post_type,
                likes_count,
                comments_count,
                created_at,
                cafes(
                    id,
                    name,
                    address,
                    latitude,
                    longitude
                ),
                author_profile:profiles!posts_author_id_fkey(
                    id,
                    full_name,
                    first_name
                ),
                post_media(
                    id,
                    file_url,
                    file_type,
                    bucket_name,
                    file_path
                )
            """)
            .order("created_at", desc=True)
            .execute()
        )

        posts = response.data or []
        post_ids = [post["id"] for post in posts if post.get("id")]

        liked_ids = set()

        if post_ids:
            liked_response = (
                user_supabase.table("post_likes")
                .select("post_id")
                .eq("user_id", user_id)
                .in_("post_id", post_ids)
                .execute()
            )

            liked_ids = {
                row["post_id"]
                for row in (liked_response.data or [])
                if row.get("post_id")
            }

        for post in posts:
            post["liked_by_user"] = post.get("id") in liked_ids

        return jsonify({"posts": posts}), 200

    except Exception as e:
        print("POST FEED ERROR:", e)
        return jsonify({"error": "Failed to fetch posts"}), 500
    


@posts_bp.route("/posts/user/<user_id>", methods=["GET"])
@require_auth
def get_user_posts_route(user_id):

    try:
        user_supabase = supabase_for_user(g.access_token)

        response = (
            user_supabase.table("posts")
            .select("""
                id,
                caption,
                likes_count,
                comments_count,
                created_at,
                cafes(name),
                post_media(
                    file_url,
                    file_type
                )
            """)
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        posts = []

        for post in (response.data or []):

            media = post.get("post_media") or []

            cafes = post.get("cafes") or []

            cafe_name = None

            if isinstance(cafes, list) and len(cafes) > 0:
                cafe_name = cafes[0].get("name")
            elif isinstance(cafes, dict):
                cafe_name = cafes.get("name")

            for item in media:
                posts.append({
                    "id": post["id"],
                    "caption": post.get("caption"),
                    "likes_count": post.get("likes_count", 0),
                    "comments_count": post.get("comments_count", 0),
                    "created_at": post.get("created_at"),
                    "file_url": item.get("file_url"),
                    "file_type": item.get("file_type"),
                    "cafe_name": cafe_name,
                })

        return jsonify(posts), 200

    except Exception as e:
        print("FETCH USER POSTS ERROR:", e)
        return jsonify({
            "error": "Failed to fetch user posts"
        }), 500