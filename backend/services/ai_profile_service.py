from collections import Counter, defaultdict

from database.supabase_client import supabase
from services.gemini_services import (
    summarize_cafe_reviews_with_gemini,
    generate_recommendation_explanations_with_gemini,
)
from services.review_service import (
    get_user_reviews,
    get_cafe_review_text_map,
    get_cafe_review_stats,
)
from services.user_profile_service import build_user_profile
from services.menu_service import get_all_menu_items


def get_all_active_cafes():
    response = (
        supabase.table("cafes")
        .select("*")
        .eq("active", True)
        .execute()
    )
    return response.data or []


def get_all_cafe_tags():
    response = (
        supabase.table("cafe_tags")
        .select("cafe_id, tag_id, tags(id, name, category)")
        .execute()
    )
    return response.data or []


def build_cafe_tag_detail_map(cafe_tag_rows):
    cafe_tag_detail_map = defaultdict(list)
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

        cafe_tag_detail_map[cafe_id].append({
            "id": tag_id,
            "name": tag_obj.get("name"),
            "category": tag_obj.get("category"),
        })

    return cafe_tag_detail_map


def build_menu_map(menu_rows):
    menu_map = defaultdict(list)
    for row in menu_rows:
        cafe_id = row.get("cafe_id")
        if cafe_id:
            menu_map[cafe_id].append(row)
    return menu_map


def summarize_reviews_for_cafe(cafe_id: str, cafe_name: str = None, limit_per_cafe=8):
    review_map = get_cafe_review_text_map(limit_per_cafe=limit_per_cafe)
    review_rows = review_map.get(cafe_id, [])

    if not review_rows:
        return None

    return summarize_cafe_reviews_with_gemini(
        cafe_name=cafe_name or "Unknown cafe",
        review_rows=review_rows,
    )


def summarize_reviews_for_all_cafes(limit_per_cafe=8):
    cafes = get_all_active_cafes()
    review_map = get_cafe_review_text_map(limit_per_cafe=limit_per_cafe)

    summaries = {}

    for cafe in cafes:
        cafe_id = cafe.get("id")
        review_rows = review_map.get(cafe_id, [])
        if not review_rows:
            summaries[cafe_id] = None
            continue

        summaries[cafe_id] = summarize_cafe_reviews_with_gemini(
            cafe_name=cafe.get("name") or "Unknown cafe",
            review_rows=review_rows,
        )

    return summaries


def infer_user_taste_profile(user_id: str):
    profile = build_user_profile(user_id)
    user_reviews = get_user_reviews(user_id)

    highly_rated_count = 0
    low_rated_count = 0

    for review in user_reviews:
        rating = review.get("rating")
        if rating is None:
            continue
        if rating >= 4:
            highly_rated_count += 1
        elif rating <= 2:
            low_rated_count += 1

    taste_profile = {
        "user_id": user_id,
        "favorite_items": profile.get("favorite_items", []),
        "favorite_categories": profile.get("favorite_categories", []),
        "liked_cafe_ids": profile.get("liked_cafe_ids", []),
        "disliked_cafe_ids": profile.get("disliked_cafe_ids", []),
        "tag_names": profile.get("tag_names", []),
        "atmosphere": profile.get("atmosphere", []),
        "vibe": profile.get("vibe", []),
        "food_preferences": profile.get("food_preferences", []),
        "work_preferences": profile.get("work_preferences", []),
        "review_keywords_positive": profile.get("review_keywords_positive", []),
        "review_keywords_negative": profile.get("review_keywords_negative", []),
        "inferred_traits": profile.get("inferred_traits", {}),
        "history_strength": {
            "highly_rated_count": highly_rated_count,
            "low_rated_count": low_rated_count,
        },
    }

    return taste_profile


def infer_cafe_traits(cafe_id: str):
    cafes = get_all_active_cafes()
    cafe_lookup = {c["id"]: c for c in cafes if c.get("id")}

    cafe = cafe_lookup.get(cafe_id)
    if not cafe:
        return None

    cafe_tag_rows = get_all_cafe_tags()
    cafe_tag_map = build_cafe_tag_detail_map(cafe_tag_rows)

    menu_rows = get_all_menu_items()
    menu_map = build_menu_map(menu_rows)

    review_stats_map = get_cafe_review_stats()
    review_summary = summarize_reviews_for_cafe(
        cafe_id=cafe_id,
        cafe_name=cafe.get("name"),
        limit_per_cafe=8,
    )

    tags = cafe_tag_map.get(cafe_id, [])
    menu_items = menu_map.get(cafe_id, [])

    tag_names = [t.get("name") for t in tags if t.get("name")]
    menu_names = [m.get("normalized_name") or m.get("name") for m in menu_items if m.get("name")]

    top_keywords = Counter()
    for item in menu_items:
        for keyword in item.get("keywords", []):
            top_keywords[keyword] += 1

    trait_flags = {
        "has_matcha": any("matcha" in str(name).lower() for name in menu_names if name),
        "has_pastries": any(
            any(word in str(name).lower() for word in ["croissant", "muffin", "scone", "pastry", "cookie"])
            for name in menu_names if name
        ),
        "study_friendly_signal": "study" in [str(x).lower() for x in tag_names],
        "wifi_signal": bool((cafe.get("attributes") or {}).get("wifi") or cafe.get("wifi")),
    }

    return {
        "cafe_id": cafe_id,
        "name": cafe.get("name"),
        "description": cafe.get("description"),
        "price_level": cafe.get("price_level"),
        "tags": tag_names,
        "review_stats": review_stats_map.get(cafe_id, {"avg_rating": None, "review_count": 0}),
        "review_summary": review_summary,
        "menu_item_names": menu_names[:20],
        "top_menu_keywords": [word for word, _ in top_keywords.most_common(20)],
        "trait_flags": trait_flags,
    }


def generate_ai_recommendation_explanations(user_id: str, recommendations: list[dict]):
    profile = build_user_profile(user_id)

    return generate_recommendation_explanations_with_gemini(
        user_prefs=profile,
        user_tag_names=profile.get("tag_names", []),
        recommendations=recommendations,
    )


def build_ai_ready_recommendation_payload(recommendations: list[dict]):
    payload = []

    for rec in recommendations:
        cafe = rec.get("cafe") or {}
        cafe_profile = rec.get("cafe_profile") or {}

        payload.append({
            "cafe_id": cafe.get("id"),
            "cafe_name": cafe.get("name"),
            "score": rec.get("score"),
            "distance_miles": rec.get("distance_miles"),
            "matching_tag_names": rec.get("matching_tag_names", []),
            "menu_matches": rec.get("menu_matches", []),
            "top_menu_items": rec.get("menu_preview", []),
            "review_stats": rec.get("review_stats", {}),
            "review_summary": rec.get("review_summary"),
            "wifi": cafe_profile.get("wifi"),
            "outlets": cafe_profile.get("outlets"),
            "price_level": cafe_profile.get("price_level"),
            "rules_based_reasons": rec.get("reasons", []),
        })

    return payload


def attach_ai_explanations_to_recommendations(user_id: str, recommendations: list[dict], top_k=5):
    if not recommendations:
        return recommendations

    top_slice = recommendations[:top_k]
    payload = build_ai_ready_recommendation_payload(top_slice)

    explanations = generate_ai_recommendation_explanations(
        user_id=user_id,
        recommendations=payload,
    )

    explanation_map = {
        item["cafe_id"]: item["explanation"]
        for item in explanations
        if item.get("cafe_id") and item.get("explanation")
    }

    for rec in top_slice:
        cafe = rec.get("cafe") or {}
        rec["gemini_explanation"] = explanation_map.get(cafe.get("id"))

    recommendations[:top_k] = top_slice
    return recommendations