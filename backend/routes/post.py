from flask import Blueprint, jsonify, request, g
from database.auth_middleware import require_auth
from services.post_service import create_post_with_uploaded_media

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
    cafe_id = data.get("cafe_id")
    caption = data.get("caption", "")
    post_type = data.get("post_type", "user")
    bucket_name = data.get("bucket_name")
    file_path = data.get("file_path")
    file_url = data.get("file_url")
    file_type = data.get("file_type")

    if not cafe_id or not file_url or not file_type:
        return jsonify({"error": "Missing required fields"}), 400

    result = create_post_with_uploaded_media(
        access_token=access_token,
        user_id=user_id,
        cafe_id=cafe_id,
        caption=caption,
        post_type=post_type,
        bucket_name=bucket_name,
        file_path=file_path,
        file_url=file_url,
        file_type=file_type,
    )

    return jsonify(result), 201