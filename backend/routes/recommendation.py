from flask import Blueprint, jsonify, request, g
from database.auth_middleware import require_auth
from services.recommendation_service import get_recommendations_for_user

recommendations_bp = Blueprint("recommendations_bp", __name__)


@recommendations_bp.route("/recommendations", methods=["GET"])
@require_auth
def get_recommendations():
    limit = request.args.get("limit", default=10, type=int)
    user_lat = request.args.get("lat", type=float)
    user_lng = request.args.get("lng", type=float)

    recommendations = get_recommendations_for_user(
        user_id=g.user["id"],
        limit=limit,
        user_lat=user_lat,
        user_lng=user_lng,
    )

    return jsonify({"recommendations": recommendations}), 200