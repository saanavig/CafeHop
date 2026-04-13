from math import radians, sin, cos, sqrt, atan2
from collections import defaultdict, Counter
import re

from services.user_profile_service import build_user_profile
from database.supabase_client import supabase
from services.gemini_services import generate_recommendation_explanations_with_gemini
from services.review_service import (
    get_user_reviews,
    get_cafe_review_stats,
    get_cafe_review_text_map,
    attach_review_summaries_to_recommendations,
)

DEFAULT_MAX_DISTANCE_MILES = 5.0
TOP_K_FOR_AI_EXPLANATIONS = 5


def haversine_miles(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return None

    r = 3958.8
    dlat = radians(float(lat2) - float(lat1))
    dlon = radians(float(lon2) - float(lon1))

    a = (
        sin(dlat / 2) ** 2
        + cos(radians(float(lat1))) * cos(radians(float(lat2))) * sin(dlon / 2) ** 2
    )
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return round(r * c, 2)


def safe_lower(value):
    if value is None:
        return None
    return str(value).strip().lower()


def normalize_text_token(value):
    if not value:
        return None
    cleaned = re.sub(r"[^a-zA-Z0-9\s&\-]", "", str(value).strip().lower())
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned or None


def normalize_text_list(values):
    if not values:
        return []
    normalized = []
    seen = set()
    for value in values:
        token = normalize_text_token(value)
        if token and token not in seen:
            seen.add(token)
            normalized.append(token)
    return normalized


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


def get_all_menu_items():
    """
    Works with your pasted schema:
    menu_items(id, cafe_id, name, price, category, created_at, image_url)
    """
    try:
        response = (
            supabase.table("menu_items")
            .select("*")
            .execute()
        )
        return response.data or []
    except Exception:
        return []


def build_cafe_tag_map(cafe_tag_rows):
    cafe_tag_map = defaultdict(set)
    for row in cafe_tag_rows:
        cafe_id = row.get("cafe_id")
        tag_id = row.get("tag_id")
        if cafe_id and tag_id:
            cafe_tag_map[cafe_id].add(tag_id)
    return cafe_tag_map


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
        if not cafe_id:
            continue
        menu_map[cafe_id].append(row)
    return menu_map


def build_interaction_map_from_profile(user_profile):
    """
    Converts user_profile['interaction_per_cafe'] into:
    {
      cafe_id: Counter({
         "view": 2,
         "favorite": 1,
         "purchase": 3,
      })
    }
    """
    return {
        cafe_id: Counter(counts)
        for cafe_id, counts in user_profile.get("interaction_per_cafe", {}).items()
    }


def build_cafe_profile(cafe, cafe_tags, menu_items, review_stats):
    attributes = cafe.get("attributes") or {}

    tag_names = []
    for tag in cafe_tags:
        name = tag.get("name")
        token = normalize_text_token(name)
        if token:
            tag_names.append(token)

    menu_names = []
    menu_categories = []
    for item in menu_items:
        item_name = normalize_text_token(item.get("name"))
        item_category = normalize_text_token(item.get("category"))

        if item_name:
            menu_names.append(item_name)
        if item_category:
            menu_categories.append(item_category)

    return {
        "cafe_id": cafe.get("id"),
        "name": cafe.get("name"),
        "description": cafe.get("description"),
        "price_level": cafe.get("price_level"),
        "attributes": attributes,
        "wifi": cafe.get("wifi", attributes.get("wifi")),
        "outlets": cafe.get("outlets", attributes.get("outlets")),
        "noise_level": cafe.get("noise_level", attributes.get("noise_level")),
        "tag_names": list(dict.fromkeys(tag_names)),
        "menu_item_names": list(dict.fromkeys(menu_names)),
        "menu_categories": list(dict.fromkeys(menu_categories)),
        "review_stats": review_stats or {"avg_rating": None, "review_count": 0},
    }


def score_distance(distance_miles, max_distance):
    if distance_miles is None:
        return 0, []

    if distance_miles > max_distance:
        return 0, []

    reasons = []
    if distance_miles <= 1:
        reasons.append("very close by")
        return 25, reasons
    if distance_miles <= 2:
        reasons.append("close to you")
        return 20, reasons
    if distance_miles <= 3:
        reasons.append("nearby")
        return 15, reasons
    if distance_miles <= 5:
        return 10, reasons

    return max(1, int((1 - (distance_miles / max_distance)) * 10)), reasons


def score_preference_fit(user_profile, cafe_profile):
    score = 0
    reasons = []

    if user_profile["wants_wifi"] and cafe_profile["wifi"] is True:
        score += 8
        reasons.append("has WiFi")

    preferred_price = user_profile.get("preferred_price_level")
    cafe_price = cafe_profile.get("price_level")
    if preferred_price is not None and cafe_price is not None:
        if cafe_price == preferred_price:
            score += 8
            reasons.append("matches your price preference")
        elif abs(cafe_price - preferred_price) == 1:
            score += 4

    cafe_tokens = set(
        cafe_profile["tag_names"]
        + cafe_profile["menu_categories"]
        + cafe_profile["menu_item_names"]
    )

    for token in user_profile["atmosphere"]:
        if token in cafe_tokens:
            score += 3
            reasons.append(f"matches your atmosphere preference for {token}")

    for token in user_profile["vibe"]:
        if token in cafe_tokens:
            score += 3
            reasons.append(f"matches your vibe preference for {token}")

    for token in user_profile["work_preferences"]:
        if token in cafe_tokens:
            score += 3
            reasons.append(f"fits your work preference for {token}")

    for token in user_profile["food_preferences"]:
        if token in cafe_tokens:
            score += 4
            reasons.append(f"fits your food preference for {token}")

    return score, dedupe_reasons(reasons)


def score_tag_overlap(user_profile, cafe_profile):
    user_tags = set(user_profile["tag_names"])
    cafe_tags = set(cafe_profile["tag_names"])

    overlap = user_tags.intersection(cafe_tags)
    if not overlap:
        return 0, [], []

    score = min(20, len(overlap) * 5)
    reasons = [f"matches your tags: {', '.join(sorted(overlap)[:3])}"]
    return score, list(overlap), reasons


def score_reviews(cafe_profile):
    stats = cafe_profile["review_stats"]
    avg_rating = stats.get("avg_rating")
    review_count = stats.get("review_count", 0)

    if avg_rating is None:
        return 0, []

    score = 0
    reasons = []

    if avg_rating >= 4.7:
        score += 12
        reasons.append("excellent reviews")
    elif avg_rating >= 4.4:
        score += 10
        reasons.append("very strong reviews")
    elif avg_rating >= 4.0:
        score += 7
        reasons.append("strong reviews")
    elif avg_rating >= 3.5:
        score += 4

    if review_count >= 20:
        score += 6
        reasons.append("many customer reviews")
    elif review_count >= 10:
        score += 4
    elif review_count >= 3:
        score += 2

    return score, dedupe_reasons(reasons)


def score_interactions(cafe_id, interaction_map, liked_cafe_ids):
    score = 0
    reasons = []

    counts = interaction_map.get(cafe_id, Counter())

    if counts.get("favorite", 0) > 0:
        score += 12
        reasons.append("you have favorited this cafe before")

    if counts.get("purchase", 0) > 0:
        score += min(10, counts["purchase"] * 3)
        reasons.append("you have ordered here before")

    if counts.get("view", 0) >= 2:
        score += 3
        reasons.append("you have shown interest in this cafe")

    if cafe_id in liked_cafe_ids:
        score += 10
        reasons.append("you rated this cafe highly before")

    return score, dedupe_reasons(reasons)


def score_menu_affinity(user_profile, cafe_profile):
    """
    This is where the future 'you like matcha' logic plugs in.
    It already works if user_item_preferences exists.
    """
    favorite_items = set(user_profile["favorite_items"])
    if not favorite_items:
        return 0, [], []

    cafe_menu_names = set(cafe_profile["menu_item_names"])

    direct_matches = set()
    fuzzy_matches = set()

    for favorite in favorite_items:
        for menu_item in cafe_menu_names:
            if favorite == menu_item:
                direct_matches.add(favorite)
            elif favorite in menu_item or menu_item in favorite:
                fuzzy_matches.add(favorite)

    score = 0
    reasons = []

    if direct_matches:
        score += min(18, len(direct_matches) * 6)
        reasons.append(
            f"has menu items similar to what you order: {', '.join(sorted(direct_matches)[:3])}"
        )

    if fuzzy_matches:
        score += min(10, len(fuzzy_matches) * 3)
        reasons.append(
            f"menu may fit your taste: {', '.join(sorted(fuzzy_matches)[:3])}"
        )

    all_matches = list(direct_matches.union(fuzzy_matches))
    return score, all_matches, dedupe_reasons(reasons)


def score_cafe(
    cafe,
    user_profile,
    user_tag_ids,
    user_tag_lookup,
    cafe_tag_ids,
    cafe_profile,
    interaction_map,
    liked_cafe_ids,
    distance_miles,
):
    total_score = 0
    reasons = []

    max_distance = user_profile["max_distance_miles"]

    distance_score, distance_reasons = score_distance(distance_miles, max_distance)
    total_score += distance_score
    reasons.extend(distance_reasons)

    pref_score, pref_reasons = score_preference_fit(user_profile, cafe_profile)
    total_score += pref_score
    reasons.extend(pref_reasons)

    tag_score, matching_tag_names, tag_reasons = score_tag_overlap(user_profile, cafe_profile)
    total_score += tag_score
    reasons.extend(tag_reasons)

    review_score, review_reasons = score_reviews(cafe_profile)
    total_score += review_score
    reasons.extend(review_reasons)

    interaction_score, interaction_reasons = score_interactions(
        cafe_id=cafe.get("id"),
        interaction_map=interaction_map,
        liked_cafe_ids=liked_cafe_ids,
    )
    total_score += interaction_score
    reasons.extend(interaction_reasons)

    menu_score, menu_matches, menu_reasons = score_menu_affinity(user_profile, cafe_profile)
    total_score += menu_score
    reasons.extend(menu_reasons)

    matching_tag_ids = [
        tag_id
        for tag_id in cafe_tag_ids
        if tag_id in user_tag_ids
    ]

    return {
        "score": total_score,
        "reasons": dedupe_reasons(reasons),
        "matching_tag_ids": matching_tag_ids,
        "matching_tag_names": matching_tag_names,
        "review_stats": cafe_profile["review_stats"],
        "menu_matches": menu_matches,
    }


def dedupe_reasons(reasons):
    deduped = []
    seen = set()
    for reason in reasons:
        if reason and reason not in seen:
            seen.add(reason)
            deduped.append(reason)
    return deduped


def attach_gemini_explanations(user_profile, recommendations):
    user_tag_names = user_profile.get("tag_names", [])

    simplified = []
    for rec in recommendations[:TOP_K_FOR_AI_EXPLANATIONS]:
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
            "wifi": rec.get("cafe_profile", {}).get("wifi"),
            "outlets": rec.get("cafe_profile", {}).get("outlets"),
            "price_level": rec.get("cafe_profile", {}).get("price_level"),
            "menu_matches": rec.get("menu_matches", []),
            "top_menu_items": rec.get("menu_preview", []),
            "rules_based_reasons": rec["reasons"],
        })

    try:
        explanations = generate_recommendation_explanations_with_gemini(
            user_prefs=user_profile,
            user_tag_names=user_tag_names,
            recommendations=simplified,
        )

        explanation_map = {
            item["cafe_id"]: item["explanation"]
            for item in explanations
            if item.get("cafe_id") and item.get("explanation")
        }

        for rec in recommendations[:TOP_K_FOR_AI_EXPLANATIONS]:
            rec["gemini_explanation"] = explanation_map.get(rec["cafe"]["id"])
    except Exception:
        for rec in recommendations[:TOP_K_FOR_AI_EXPLANATIONS]:
            rec["gemini_explanation"] = None

    return recommendations


def get_recommendations_for_user(
    user_id,
    limit=10,
    user_lat=None,
    user_lng=None,
    bad_review_threshold=2,
):
    # -----------------------------
    # 1. Fetch user-side signals
    # -----------------------------
    user_profile = build_user_profile(user_id)
    user_reviews = get_user_reviews(user_id)

    # -----------------------------
    # 2. Fetch cafe-side signals
    # -----------------------------
    cafes = get_all_active_cafes()
    cafe_tag_rows = get_all_cafe_tags()
    review_stats = get_cafe_review_stats()
    cafe_review_text_map = get_cafe_review_text_map(limit_per_cafe=5)
    menu_rows = get_all_menu_items()

    user_tag_ids = user_profile["user_tag_ids"]
    user_tag_lookup = user_profile["user_tag_lookup"]

    cafe_tag_map = build_cafe_tag_map(cafe_tag_rows)
    cafe_tag_detail_map = build_cafe_tag_detail_map(cafe_tag_rows)
    menu_map = build_menu_map(menu_rows)
    interaction_map = build_interaction_map_from_profile(user_profile)

    bad_cafe_ids = {
        cafe_id
        for cafe_id in user_profile["disliked_cafe_ids"]
    }

    liked_cafe_ids = {
        cafe_id
        for cafe_id in user_profile["liked_cafe_ids"]
    }

    recommendations = []

    # -----------------------------
    # 3. Candidate retrieval + scoring
    # -----------------------------
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
                distance_miles is not None
                and distance_miles > user_profile["max_distance_miles"]
            ):
                continue

        cafe_tags = cafe_tag_detail_map.get(cafe_id, [])
        cafe_profile = build_cafe_profile(
            cafe=cafe,
            cafe_tags=cafe_tags,
            menu_items=menu_map.get(cafe_id, []),
            review_stats=review_stats.get(cafe_id),
        )

        scored = score_cafe(
            cafe=cafe,
            user_profile=user_profile,
            user_tag_ids=user_tag_ids,
            user_tag_lookup=user_tag_lookup,
            cafe_tag_ids=cafe_tag_map.get(cafe_id, set()),
            cafe_profile=cafe_profile,
            interaction_map=interaction_map,
            liked_cafe_ids=liked_cafe_ids,
            distance_miles=distance_miles,
        )

        recommendations.append({
            "cafe": cafe,
            "cafe_profile": cafe_profile,
            "score": scored["score"],
            "reasons": scored["reasons"],
            "matching_tag_ids": scored["matching_tag_ids"],
            "matching_tag_names": scored["matching_tag_names"],
            "review_stats": scored["review_stats"],
            "distance_miles": distance_miles,
            "cafe_tags": cafe_tags,
            "menu_matches": scored["menu_matches"],
            "menu_preview": cafe_profile["menu_item_names"][:5],
            "review_summary": None,
            "review_samples": [],
            "gemini_explanation": None,
        })

    # -----------------------------
    # 4. Sort and trim
    # -----------------------------
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

    # -----------------------------
    # 5. Enrich top results
    # -----------------------------
    top_to_enrich = recommendations[:TOP_K_FOR_AI_EXPLANATIONS]
    top_to_enrich = attach_review_summaries_to_recommendations(
        top_to_enrich,
        cafe_review_text_map,
    )
    recommendations[:TOP_K_FOR_AI_EXPLANATIONS] = top_to_enrich

    recommendations = attach_gemini_explanations(
        user_profile=user_profile,
        recommendations=recommendations,
    )

    return recommendations