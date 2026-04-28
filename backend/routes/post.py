from flask import Blueprint, jsonify, request, g
from database.auth_middleware import require_auth
from services.post_service import create_post_with_uploaded_media
from database.supabase_client import supabase

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