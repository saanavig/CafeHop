from flask import Blueprint, jsonify, request, g
from database.auth_middleware import require_auth
from services.recommendation_service import get_recommendations_for_user
from services.ai_profile_service import (
    build_ai_ready_recommendation_payload,
    generate_ai_recommendation_explanations,
)

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

@recommendations_bp.route("/recommendations/explanations", methods=["GET"])
@require_auth
def get_recommendation_explanations():
    user_id = g.user["id"]

    # query params
    lat = request.args.get("lat", type=float)
    lng = request.args.get("lng", type=float)
    limit = request.args.get("limit", default=5, type=int)

    # 1. get base recommendations (ranking logic)
    recommendations = get_recommendations_for_user(
        user_id=user_id,
        limit=limit,
        user_lat=lat,
        user_lng=lng,
    )

    if not recommendations:
        return jsonify({"explanations": []}), 200

    # 2. convert to AI payload
    payload = build_ai_ready_recommendation_payload(recommendations)

    # 3. generate explanations using Gemini
    explanations = generate_ai_recommendation_explanations(
        user_id=user_id,
        recommendations=payload,
    )

    return jsonify({
        "count": len(explanations),
        "explanations": explanations
    }), 200