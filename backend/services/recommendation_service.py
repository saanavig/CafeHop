from math import radians, sin, cos, sqrt, atan2

from database.supabase_client import supabase
from services.gemini_services import generate_recommendation_explanations_with_gemini
from services.review_service import (
    get_user_reviews,
    get_cafe_review_stats,
    get_cafe_review_text_map,
    attach_review_summaries_to_recommendations,
)


def haversine_miles(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return None

    r = 3958.8
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    )
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return round(r * c, 2)


def get_user_preferences(user_id: str):
    response = (
        supabase.table("user_preferences")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return response.data or {}


def get_user_preference_tags(user_id: str):
    response = (
        supabase.table("user_preference_tags")
        .select("tag_id, tags(id, name, category)")
        .eq("user_id", user_id)
        .execute()
    )
    return response.data or []


def get_all_cafes():
    response = supabase.table("cafes").select("*").execute()
    return response.data or []


def get_all_cafe_tags():
    response = (
        supabase.table("cafe_tags")
        .select("cafe_id, tag_id, tags(id, name, category)")
        .execute()
    )
    return response.data or []


def build_user_tag_set(user_tag_rows):
    return {
        row["tag_id"]
        for row in user_tag_rows
        if row.get("tag_id")
    }


def build_user_tag_lookup(user_tag_rows):
    lookup = {}
    for row in user_tag_rows:
        tag_id = row.get("tag_id")
        tag_obj = row.get("tags") or {}
        if tag_id:
            lookup[tag_id] = {
                "id": tag_id,
                "name": tag_obj.get("name"),
                "category": tag_obj.get("category"),
            }
    return lookup


def build_cafe_tag_map(cafe_tag_rows):
    cafe_tag_map = {}
    for row in cafe_tag_rows:
        cafe_id = row.get("cafe_id")
        tag_id = row.get("tag_id")
        if not cafe_id or not tag_id:
            continue

        if cafe_id not in cafe_tag_map:
            cafe_tag_map[cafe_id] = set()

        cafe_tag_map[cafe_id].add(tag_id)

    return cafe_tag_map


def build_cafe_tag_detail_map(cafe_tag_rows):
    cafe_tag_detail_map = {}
    seen = set()

    for row in cafe_tag_rows:
        cafe_id = row.get("cafe_id")
        tag_id = row.get("tag_id")
        tag_obj = row.get("tags") or {}

        if not cafe_id or not tag_id:
            continue

        key = (cafe_id, tag_id)
        if key in seen:
            continue
        seen.add(key)

        if cafe_id not in cafe_tag_detail_map:
            cafe_tag_detail_map[cafe_id] = []

        cafe_tag_detail_map[cafe_id].append({
            "id": tag_id,
            "name": tag_obj.get("name"),
            "category": tag_obj.get("category"),
        })

    return cafe_tag_detail_map


def build_bad_cafe_set(user_reviews, bad_threshold=2):
    return {
        review["cafe_id"]
        for review in user_reviews
        if review.get("cafe_id")
        and review.get("rating") is not None
        and review["rating"] <= bad_threshold
    }


def score_cafe(cafe, user_prefs, user_tag_ids, user_tag_lookup, cafe_tag_ids, review_stats):
    score = 0
    reasons = []

    matching_tags = user_tag_ids.intersection(cafe_tag_ids)
    matching_tag_names = [
        user_tag_lookup[tag_id]["name"]
        for tag_id in matching_tags
        if tag_id in user_tag_lookup and user_tag_lookup[tag_id].get("name")
    ]

    if matching_tags:
        score += len(matching_tags) * 3
        reasons.append(f"{len(matching_tags)} matching preference tags")

    if user_prefs.get("wants_wifi") and cafe.get("wifi") is True:
        score += 2
        reasons.append("has WiFi")

    if user_prefs.get("wants_outlets") and cafe.get("outlets") is True:
        score += 2
        reasons.append("has outlets")

    preferred_price = user_prefs.get("preferred_price_level")
    if preferred_price is not None and cafe.get("price_level") == preferred_price:
        score += 2
        reasons.append("matches preferred price level")

    preferred_noise = user_prefs.get("preferred_noise_level")
    if preferred_noise is not None and cafe.get("noise_level") == preferred_noise:
        score += 2
        reasons.append("matches preferred noise level")

    cafe_id = cafe.get("id")
    stats = review_stats.get(cafe_id)

    if stats:
        avg_rating = stats["avg_rating"]
        review_count = stats["review_count"]

        if avg_rating >= 4.5:
            score += 3
            reasons.append("high average rating")
        elif avg_rating >= 4.0:
            score += 2
            reasons.append("strong reviews")
        elif avg_rating >= 3.5:
            score += 1

        if review_count >= 10:
            score += 2
            reasons.append("well-reviewed")
        elif review_count >= 3:
            score += 1

    return {
        "score": score,
        "reasons": reasons,
        "matching_tag_ids": list(matching_tags),
        "matching_tag_names": matching_tag_names,
        "review_stats": stats or {"avg_rating": None, "review_count": 0},
    }


def attach_gemini_explanations(user_prefs, user_tag_rows, recommendations):
    user_tag_names = []
    for row in user_tag_rows:
        tag = row.get("tags") or {}
        if tag.get("name"):
            user_tag_names.append(tag["name"])

    simplified = []
    for rec in recommendations[:5]:
        cafe = rec["cafe"]
        simplified.append({
            "cafe_id": cafe.get("id"),
            "cafe_name": cafe.get("name"),
            "score": rec["score"],
            "matching_tag_names": rec["matching_tag_names"],
            "cafe_tags": [t.get("name") for t in rec.get("cafe_tags", []) if t.get("name")],
            "review_stats": rec["review_stats"],
            "review_summary": rec.get("review_summary"),
            "distance_miles": rec.get("distance_miles"),
            "wifi": cafe.get("wifi"),
            "outlets": cafe.get("outlets"),
            "price_level": cafe.get("price_level"),
            "noise_level": cafe.get("noise_level"),
            "rules_based_reasons": rec["reasons"],
        })

    explanations = generate_recommendation_explanations_with_gemini(
        user_prefs=user_prefs,
        user_tag_names=user_tag_names,
        recommendations=simplified,
    )

    explanation_map = {
        item["cafe_id"]: item["explanation"]
        for item in explanations
        if item.get("cafe_id") and item.get("explanation")
    }

    for rec in recommendations[:5]:
        rec["gemini_explanation"] = explanation_map.get(rec["cafe"]["id"])

    return recommendations


def get_recommendations_for_user(
    user_id,
    limit=10,
    user_lat=None,
    user_lng=None,
    bad_review_threshold=2,
):
    user_prefs = get_user_preferences(user_id)
    user_tag_rows = get_user_preference_tags(user_id)
    user_reviews = get_user_reviews(user_id)

    cafes = get_all_cafes()
    cafe_tag_rows = get_all_cafe_tags()
    review_stats = get_cafe_review_stats()
    cafe_review_text_map = get_cafe_review_text_map(limit_per_cafe=5)

    user_tag_ids = build_user_tag_set(user_tag_rows)
    user_tag_lookup = build_user_tag_lookup(user_tag_rows)
    cafe_tag_map = build_cafe_tag_map(cafe_tag_rows)
    cafe_tag_detail_map = build_cafe_tag_detail_map(cafe_tag_rows)
    bad_cafe_ids = build_bad_cafe_set(user_reviews, bad_threshold=bad_review_threshold)

    recommendations = []
    max_distance = user_prefs.get("max_distance_miles")

    for cafe in cafes:
        cafe_id = cafe.get("id")

        if cafe_id in bad_cafe_ids:
            continue

        distance_miles = None
        if user_lat is not None and user_lng is not None:
            distance_miles = haversine_miles(
                user_lat,
                user_lng,
                cafe.get("latitude"),
                cafe.get("longitude"),
            )

            if (
                max_distance is not None
                and distance_miles is not None
                and distance_miles > max_distance
            ):
                continue

        cafe_tag_ids = cafe_tag_map.get(cafe_id, set())

        scored = score_cafe(
            cafe=cafe,
            user_prefs=user_prefs,
            user_tag_ids=user_tag_ids,
            user_tag_lookup=user_tag_lookup,
            cafe_tag_ids=cafe_tag_ids,
            review_stats=review_stats,
        )

        if distance_miles is not None:
            if distance_miles <= 1:
                scored["score"] += 3
                scored["reasons"].append("very close by")
            elif distance_miles <= 3:
                scored["score"] += 2
                scored["reasons"].append("nearby")
            elif distance_miles <= 5:
                scored["score"] += 1

        recommendations.append({
            "cafe": cafe,
            "score": scored["score"],
            "reasons": scored["reasons"],
            "matching_tag_ids": scored["matching_tag_ids"],
            "matching_tag_names": scored["matching_tag_names"],
            "review_stats": scored["review_stats"],
            "distance_miles": distance_miles,
            "cafe_tags": cafe_tag_detail_map.get(cafe_id, []),
            "review_summary": None,
            "review_samples": [],
            "gemini_explanation": None,
        })

    recommendations.sort(
        key=lambda x: (
            x["score"],
            -(x["distance_miles"] or 999999),
            x["review_stats"]["avg_rating"] or 0,
            x["review_stats"]["review_count"],
        ),
        reverse=True,
    )

    recommendations = recommendations[:limit]

    top_to_enrich = recommendations[:5]
    top_to_enrich = attach_review_summaries_to_recommendations(
        top_to_enrich,
        cafe_review_text_map,
    )
    recommendations[:5] = top_to_enrich

    recommendations = attach_gemini_explanations(
        user_prefs,
        user_tag_rows,
        recommendations,
    )

    return recommendations