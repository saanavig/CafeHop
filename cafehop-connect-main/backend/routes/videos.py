from flask import Blueprint, jsonify, request
from services.video_service import create_video, get_feed_videos, get_cafe_videos
from database.auth_middleware import require_auth

videos_bp = Blueprint("videos", __name__)

# post videos
@videos_bp.route("/videos", methods=["POST"])
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
@videos_bp.route("/videos/feed", methods=["GET"])
def video_feed():
    videos = get_feed_videos()
    return jsonify({"videos": videos}), 200

# get a particular cafe's videos
@videos_bp.route("/cafes/<cafe_id>/videos", methods=["GET"])
def spot_videos(cafe_id):
    videos = get_cafe_videos(cafe_id)
    return jsonify({"cafe_id": cafe_id, "videos": videos}), 200