from flask import Blueprint, jsonify, request, g
from database.auth_middleware import require_auth
from database.supabase_client import supabase
from services.recommendation_service import (
    get_recommendations_for_user,
    build_ai_ready_recommendation_payload,
    generate_rule_based_explanations,
)
from services.user_profile_service import build_user_profile
from services.gemini_services import generate_recommendation_explanations_with_gemini

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


def get_cached_explanations(user_id: str, cafe_ids: list[str]) -> dict:
    if not cafe_ids:
        return {}

    response = (
        supabase.table("recommendation_explanations")
        .select("cafe_id, explanation")
        .eq("user_id", user_id)
        .in_("cafe_id", cafe_ids)
        .execute()
    )

    rows = response.data or []

    return {
        row["cafe_id"]: row["explanation"]
        for row in rows
        if row.get("cafe_id") and row.get("explanation")
    }


def save_explanations_to_cache(user_id: str, explanations: list[dict]):
    if not explanations:
        return

    rows = []

    for item in explanations:
        cafe_id = item.get("cafe_id")
        explanation = item.get("explanation")

        if not cafe_id or not explanation:
            continue

        rows.append({
            "user_id": user_id,
            "cafe_id": cafe_id,
            "explanation": explanation,
        })

    if not rows:
        return

    supabase.table("recommendation_explanations").upsert(rows).execute()


@recommendations_bp.route("/recommendations/explanations", methods=["GET"])
@require_auth
def get_recommendation_explanations():
    user_id = g.user["id"]

    limit = request.args.get("limit", default=5, type=int)
    user_lat = request.args.get("lat", type=float)
    user_lng = request.args.get("lng", type=float)

    use_ai = request.args.get("use_ai", "true").lower() == "true"

    recommendations = get_recommendations_for_user(
        user_id=user_id,
        limit=limit,
        user_lat=user_lat,
        user_lng=user_lng,
    )

    if not recommendations:
        return jsonify({
            "count": 0,
            "source": "none",
            "explanations": [],
        }), 200

    cafe_ids = [
        rec["cafe"]["id"]
        for rec in recommendations
        if rec.get("cafe") and rec["cafe"].get("id")
    ]

    cached_map = get_cached_explanations(user_id, cafe_ids)

    cached_explanations = [
        {
            "cafe_id": cafe_id,
            "explanation": cached_map[cafe_id],
        }
        for cafe_id in cafe_ids
        if cafe_id in cached_map
    ]

    missing_cafe_ids = [
        cafe_id
        for cafe_id in cafe_ids
        if cafe_id not in cached_map
    ]

    if not missing_cafe_ids:
        return jsonify({
            "count": len(cached_explanations),
            "source": "cache",
            "explanations": cached_explanations,
        }), 200

    missing_recommendations = [
        rec
        for rec in recommendations
        if rec.get("cafe") and rec["cafe"].get("id") in missing_cafe_ids
    ]

    if not use_ai:
        fallback = generate_rule_based_explanations(missing_recommendations)
        save_explanations_to_cache(user_id, fallback)

        combined = cached_explanations + fallback

        return jsonify({
            "count": len(combined),
            "source": "cache_plus_rule_based_fallback",
            "message": "AI disabled. Showing cached and rule-based explanations.",
            "explanations": combined,
        }), 200

    user_profile = build_user_profile(user_id)

    ai_payload = build_ai_ready_recommendation_payload(
        missing_recommendations,
        limit=min(len(missing_recommendations), 5),
    )

    try:
        generated = generate_recommendation_explanations_with_gemini(
            user_prefs=user_profile,
            user_tag_names=user_profile.get("tag_names", []),
            recommendations=ai_payload,
        )

        save_explanations_to_cache(user_id, generated)

        combined = cached_explanations + generated

        return jsonify({
            "count": len(combined),
            "source": "cache_plus_gemini" if cached_explanations else "gemini",
            "explanations": combined,
        }), 200

    except Exception as e:
        fallback = generate_rule_based_explanations(missing_recommendations)
        save_explanations_to_cache(user_id, fallback)

        combined = cached_explanations + fallback

        return jsonify({
            "count": len(combined),
            "source": "cache_plus_rule_based_fallback" if cached_explanations else "rule_based_fallback",
            "message": "AI explanations are temporarily unavailable. Showing rule-based explanations.",
            "error": str(e),
            "explanations": combined,
        }), 200