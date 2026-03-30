from flask import Blueprint, jsonify, request, g
from database.auth_middleware import require_auth
from services.post_service import create_post, create_post_media, upload_media_file

posts_bp = Blueprint("posts", __name__)

@posts_bp.route("/posts", methods=["POST"])
@require_auth
def upload_post():
    user_id = g.user["id"]
    access_token = g.access_token

    cafe_id = request.form.get("cafe_id")
    caption = request.form.get("caption", "")
    post_type = request.form.get("post_type", "user")
    files = request.files.getlist("media")

    if not cafe_id or not files:
        return jsonify({"error": "Missing required fields"}), 400

    post = create_post(access_token, user_id, cafe_id, caption, post_type)

    media_items = []
    for file in files:
        uploaded = upload_media_file(access_token, file, cafe_id, user_id, post["id"])
        media = create_post_media(
            access_token,
            post["id"],
            uploaded["file_path"],
            uploaded["file_url"],
            uploaded["file_type"]
        )
        media_items.append(media)

    return jsonify({
        "message": "Post created",
        "post": post,
        "media": media_items
    }), 201