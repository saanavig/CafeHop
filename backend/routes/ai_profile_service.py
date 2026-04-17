from flask import Blueprint, jsonify, g
from database.auth_middleware import require_auth
from services.ai_profile_service import infer_user_taste_profile, infer_cafe_traits

ai_profile_bp = Blueprint("ai_profile_bp", __name__)


@ai_profile_bp.route("/users/me/taste-profile", methods=["GET"])
@require_auth
def get_my_taste_profile():
    profile = infer_user_taste_profile(g.user["id"])
    return jsonify({"taste_profile": profile}), 200


@ai_profile_bp.route("/cafes/<cafe_id>/ai-profile", methods=["GET"])
def get_cafe_ai_profile(cafe_id):
    profile = infer_cafe_traits(cafe_id)
    return jsonify({"cafe_profile": profile}), 200