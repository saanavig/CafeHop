from flask import Blueprint, jsonify, request, g
from services.video_service import create_video, get_feed_videos, get_cafe_videos, upload_video_file
from database.auth_middleware import require_auth

videos_bp = Blueprint("videos", __name__)

# post videos
@videos_bp.route("/videos", methods=["POST"])
@require_auth
def upload_video():

    user_id = g.user["id"]
    access_token = g.access_token

    video_file = request.files.get("video")
    cafe_id = request.form.get("cafe_id")
    caption = request.form.get("caption", "")

    if not video_file or not cafe_id:
        return jsonify({"error": "Missing required fields"}), 400

    # upload to Supabase Storage
    video_url = upload_video_file(access_token, video_file)
    video = create_video(access_token, user_id, cafe_id, video_url, caption)

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