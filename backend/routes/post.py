from flask import Blueprint, jsonify, request, g
from database.auth_middleware import require_auth
from services.post_service import create_post_with_uploaded_media
from database.supabase_client import supabase,  supabase_for_user

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
    print("LIKE ROUTE HIT:", post_id)
    user_id = g.user["id"]
    user_supabase = supabase_for_user(g.access_token)

    existing = (
        user_supabase.table("post_likes")
        .select("id")
        .eq("post_id", post_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    existing = (
        user_supabase.table("post_likes")
        .select("id")
        .eq("post_id", post_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not existing or not existing.data:
        # no existing like → insert
        try:
            insert_res = user_supabase.table("post_likes").insert({
                "post_id": post_id,
                "user_id": user_id
            }).execute()

            print("INSERT SUCCESS:", insert_res.data)

            return jsonify({"message": "Liked"}), 201

        except Exception as e:
            print("INSERT ERROR:", e)
            return jsonify({"error": str(e)}), 500

        return jsonify({"message": "Liked"}), 201

    return jsonify({"message": "Already liked"}), 200

@posts_bp.route("/posts/<post_id>/like", methods=["DELETE"])
@require_auth
def unlike_post(post_id):
    user_id = g.user["id"]
    user_supabase = supabase_for_user(g.access_token)

    user_supabase.table("post_likes") \
        .delete() \
        .eq("post_id", post_id) \
        .eq("user_id", user_id) \
        .execute()

    return jsonify({"message": "Unliked"}), 200

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
def get_comments(post_id):
    user_supabase = supabase_for_user(g.access_token)
    response = (
        user_supabase.table("comments")
        .select("*")
        .eq("post_id", post_id)
        .order("created_at", desc=True)
        .execute()
    )

    return jsonify(response.data or []), 200

@posts_bp.route("/posts/<post_id>/comments", methods=["POST"])
@require_auth
def add_comment(post_id):
    user_id = g.user["id"]
    data = request.get_json()
    user_supabase = supabase_for_user(g.access_token)

    content = data.get("content")

    if not content:
        return jsonify({"error": "Missing content"}), 400

    response = user_supabase.table("comments").insert({
        "post_id": post_id,
        "user_id": user_id,
        "content": content
    }).execute()

    return jsonify(response.data[0]), 201
