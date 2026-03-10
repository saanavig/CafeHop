from flask import Blueprint, jsonify, request
from services.tag_service import get_all_tags, get_cafe_tags, replace_cafe_tags
from services.video_service import create_video, get_feed_videos, get_cafe_videos
from database.auth_middleware import require_auth

spot_bp = Blueprint("spot", __name__)

@spot_bp.route("/tags", methods=["GET"])
def list_tags():
    tags = get_all_tags()
    return jsonify({"tags": tags}), 200


@spot_bp.route("/spots/<cafe_id>/tags", methods=["GET"])
def list_spot_tags(cafe_id):
    tags = get_cafe_tags(cafe_id)
    return jsonify({"cafe_id": cafe_id, "tags": tags}), 200


@spot_bp.route("/spots/<cafe_id>/tags", methods=["PUT"])
@require_auth
def update_spot_tags(cafe_id):
    body = request.get_json(silent=True) or {}
    tag_ids = body.get("tag_ids", [])

    if not isinstance(tag_ids, list):
        return jsonify({"error": "tag_ids must be a list"}), 400

    updated = replace_cafe_tags(cafe_id, tag_ids)
    return jsonify({"message": "Spot tags updated", "data": updated}), 200

# post videos
@spot_bp.route("/videos", methods=["POST"])
@require_auth
def upload_video():
    body = request.get_json(silent=True) or {}

    user_id = body.get("user_id")
    cafe_id = body.get("cafe_id")
    video_url = body.get("video_url")
    caption = body.get("caption", "")

    if not user_id or not cafe_id or not video_url:
        return jsonify({"error": "Missing required fields"}), 400

    video = create_video(user_id, cafe_id, video_url, caption)

    return jsonify({"message": "Video created", "data": video}), 201

#get vidoes feed
@spot_bp.route("/videos/feed", methods=["GET"])
def video_feed():
    videos = get_feed_videos()
    return jsonify({"videos": videos}), 200

# get a particular cafe's videos
@spot_bp.route("/spots/<cafe_id>/videos", methods=["GET"])
def spot_videos(cafe_id):
    videos = get_cafe_videos(cafe_id)
    return jsonify({"cafe_id": cafe_id, "videos": videos}), 200