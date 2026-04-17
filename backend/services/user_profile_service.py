from collections import Counter, defaultdict
import re

from database.supabase_client import supabase
from services.review_service import get_user_reviews


DEFAULT_MAX_DISTANCE_MILES = 5.0


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


def safe_float(value, default=None):
    try:
        if value is None:
            return default
        return float(value)
    except Exception:
        return default


def safe_int(value, default=None):
    try:
        if value is None:
            return default
        return int(value)
    except Exception:
        return default


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
    """
    Safe even if user_preference_tags table is not present yet.
    """
    try:
        response = (
            supabase.table("user_preference_tags")
            .select("tag_id, tags(id, name, category)")
            .eq("user_id", user_id)
            .execute()
        )
        return response.data or []
    except Exception:
        return []


def get_user_cafe_interactions(user_id: str):
    try:
        response = (
            supabase.table("user_cafe_interactions")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        return response.data or []
    except Exception:
        return []


def get_user_receipt_item_preferences(user_id: str):
    """
    Preferred source once user_item_preferences exists.
    """
    try:
        response = (
            supabase.table("user_item_preferences")
            .select("*")
            .eq("user_id", user_id)
            .order("score", desc=True)
            .order("order_count", desc=True)
            .execute()
        )
        return response.data or []
    except Exception:
        return []


def get_user_receipt_items(user_id: str):
    """
    Fallback source if receipt_items exists but user_item_preferences
    has not been created yet.
    """
    try:
        response = (
            supabase.table("receipt_items")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []
    except Exception:
        return []


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

        if not tag_id:
            continue

        lookup[tag_id] = {
            "id": tag_id,
            "name": tag_obj.get("name"),
            "category": tag_obj.get("category"),
        }

    return lookup


def build_interaction_summary(interaction_rows):
    counts = Counter()
    per_cafe = defaultdict(Counter)

    for row in interaction_rows:
        cafe_id = row.get("cafe_id")
        interaction_type = normalize_text_token(row.get("interaction_type"))

        if not interaction_type:
            continue

        counts[interaction_type] += 1

        if cafe_id:
            per_cafe[cafe_id][interaction_type] += 1

    return {
        "counts": dict(counts),
        "per_cafe": {cafe_id: dict(counter) for cafe_id, counter in per_cafe.items()},
    }


def build_review_summary(user_reviews):
    liked_cafe_ids = []
    disliked_cafe_ids = []

    rating_counts = Counter()
    positive_keywords = Counter()
    negative_keywords = Counter()

    for review in user_reviews:
        cafe_id = review.get("cafe_id")
        rating = review.get("rating")
        review_text = review.get("review_text") or ""

        if rating is not None:
            rating_counts[int(rating)] += 1

            if rating >= 4 and cafe_id:
                liked_cafe_ids.append(cafe_id)
            elif rating <= 2 and cafe_id:
                disliked_cafe_ids.append(cafe_id)

        tokens = [
            tok for tok in normalize_text_list(re.split(r"[\s,.;:!?\-/()]+", review_text))
            if tok and len(tok) > 2
        ]

        if rating is not None and rating >= 4:
            for token in tokens:
                positive_keywords[token] += 1
        elif rating is not None and rating <= 2:
            for token in tokens:
                negative_keywords[token] += 1

    return {
        "liked_cafe_ids": list(dict.fromkeys(liked_cafe_ids)),
        "disliked_cafe_ids": list(dict.fromkeys(disliked_cafe_ids)),
        "rating_counts": dict(rating_counts),
        "top_positive_keywords": [word for word, _ in positive_keywords.most_common(15)],
        "top_negative_keywords": [word for word, _ in negative_keywords.most_common(15)],
    }


def build_item_preferences_from_rows(user_item_prefs, receipt_items):
    """
    Priority:
    1. user_item_preferences
    2. derive from receipt_items
    """
    favorite_items = []
    favorite_categories = []
    item_scores = {}

    if user_item_prefs:
        for row in user_item_prefs:
            item_name = (
                row.get("normalized_item")
                or row.get("item_name")
                or row.get("name")
            )
            item_token = normalize_text_token(item_name)

            if not item_token:
                continue

            favorite_items.append(item_token)
            item_scores[item_token] = {
                "score": safe_float(row.get("score"), 0) or 0,
                "order_count": safe_int(row.get("order_count"), 0) or 0,
                "last_ordered_at": row.get("last_ordered_at"),
            }

            category = normalize_text_token(row.get("item_category") or row.get("category"))
            if category:
                favorite_categories.append(category)

        return {
            "favorite_items": list(dict.fromkeys(favorite_items)),
            "favorite_categories": list(dict.fromkeys(favorite_categories)),
            "item_scores": item_scores,
            "source": "user_item_preferences",
        }

    if receipt_items:
        item_counter = Counter()
        category_counter = Counter()

        for row in receipt_items:
            item_name = (
                row.get("normalized_name")
                or row.get("item_name")
                or row.get("name")
            )
            item_token = normalize_text_token(item_name)
            if item_token:
                qty = safe_int(row.get("quantity"), 1) or 1
                item_counter[item_token] += qty

            category = normalize_text_token(row.get("item_category") or row.get("category"))
            if category:
                category_counter[category] += 1

        for item_name, count in item_counter.most_common(20):
            favorite_items.append(item_name)
            item_scores[item_name] = {
                "score": float(count),
                "order_count": int(count),
                "last_ordered_at": None,
            }

        favorite_categories = [name for name, _ in category_counter.most_common(10)]

        return {
            "favorite_items": favorite_items,
            "favorite_categories": favorite_categories,
            "item_scores": item_scores,
            "source": "receipt_items",
        }

    return {
        "favorite_items": [],
        "favorite_categories": [],
        "item_scores": {},
        "source": None,
    }


def build_explicit_preference_summary(user_prefs, user_tag_rows):
    atmosphere = normalize_text_list(user_prefs.get("atmosphere"))
    vibe = normalize_text_list(user_prefs.get("vibe"))
    food_preferences = normalize_text_list(user_prefs.get("food_preferences"))
    work_preferences = normalize_text_list(user_prefs.get("work_preferences"))

    tag_names = []
    tag_categories = defaultdict(list)

    for row in user_tag_rows:
        tag = row.get("tags") or {}
        name = normalize_text_token(tag.get("name"))
        category = normalize_text_token(tag.get("category"))

        if name:
            tag_names.append(name)
        if name and category:
            tag_categories[category].append(name)

    return {
        "max_distance_miles": safe_float(
            user_prefs.get("max_distance_miles"),
            DEFAULT_MAX_DISTANCE_MILES,
        ),
        "wants_wifi": bool(user_prefs.get("wants_wifi") or False),
        "preferred_price_level": safe_int(user_prefs.get("preferred_price_level")),
        "atmosphere": atmosphere,
        "vibe": vibe,
        "food_preferences": food_preferences,
        "work_preferences": work_preferences,
        "tag_names": list(dict.fromkeys(tag_names)),
        "tag_categories": {
            category: list(dict.fromkeys(values))
            for category, values in tag_categories.items()
        },
    }


def infer_user_traits(explicit_prefs, review_summary, item_summary, interaction_summary):
    """
    Lightweight rules-based trait layer.
    This keeps the system usable before you add a dedicated AI taste-profile table.
    """
    traits = {}

    if explicit_prefs["wants_wifi"]:
        traits["wifi_needed"] = 1.0

    if "study" in explicit_prefs["work_preferences"] or "work" in explicit_prefs["work_preferences"]:
        traits["study_friendly"] = 0.9

    if "quiet" in explicit_prefs["vibe"] or "quiet" in explicit_prefs["atmosphere"]:
        traits["quiet"] = 0.9

    if "cozy" in explicit_prefs["vibe"] or "cozy" in explicit_prefs["atmosphere"]:
        traits["cozy"] = 0.8

    if explicit_prefs["preferred_price_level"] == 1:
        traits["budget_friendly"] = 0.85

    if explicit_prefs["preferred_price_level"] == 3:
        traits["premium_ok"] = 0.75

    for item in item_summary["favorite_items"]:
        if "matcha" in item:
            traits["matcha_affinity"] = max(traits.get("matcha_affinity", 0), 0.95)
        if "latte" in item:
            traits["latte_affinity"] = max(traits.get("latte_affinity", 0), 0.8)
        if "croissant" in item or "pastry" in item:
            traits["pastry_affinity"] = max(traits.get("pastry_affinity", 0), 0.85)
        if "chai" in item:
            traits["chai_affinity"] = max(traits.get("chai_affinity", 0), 0.9)

    favorite_count = interaction_summary["counts"].get("favorite", 0)
    purchase_count = interaction_summary["counts"].get("purchase", 0)

    if favorite_count >= 3:
        traits["repeat_explorer"] = 0.7

    if purchase_count >= 3:
        traits["repeat_buyer"] = 0.8

    if len(review_summary["liked_cafe_ids"]) >= 3:
        traits["strong_cafe_history"] = 0.75

    return traits


def build_user_profile(
    user_id: str,
    include_raw=False,
):
    user_prefs = get_user_preferences(user_id)
    user_tag_rows = get_user_preference_tags(user_id)
    user_reviews = get_user_reviews(user_id)
    interaction_rows = get_user_cafe_interactions(user_id)
    user_item_prefs = get_user_receipt_item_preferences(user_id)
    receipt_items = get_user_receipt_items(user_id)

    explicit_prefs = build_explicit_preference_summary(user_prefs, user_tag_rows)
    review_summary = build_review_summary(user_reviews)
    interaction_summary = build_interaction_summary(interaction_rows)
    item_summary = build_item_preferences_from_rows(user_item_prefs, receipt_items)
    user_tag_ids = build_user_tag_set(user_tag_rows)
    user_tag_lookup = build_user_tag_lookup(user_tag_rows)
    inferred_traits = infer_user_traits(
        explicit_prefs=explicit_prefs,
        review_summary=review_summary,
        item_summary=item_summary,
        interaction_summary=interaction_summary,
    )

    profile = {
        "user_id": user_id,
        "max_distance_miles": explicit_prefs["max_distance_miles"],
        "wants_wifi": explicit_prefs["wants_wifi"],
        "preferred_price_level": explicit_prefs["preferred_price_level"],
        "atmosphere": explicit_prefs["atmosphere"],
        "vibe": explicit_prefs["vibe"],
        "food_preferences": explicit_prefs["food_preferences"],
        "work_preferences": explicit_prefs["work_preferences"],
        "tag_names": explicit_prefs["tag_names"],
        "tag_categories": explicit_prefs["tag_categories"],
        "favorite_items": item_summary["favorite_items"],
        "favorite_categories": item_summary["favorite_categories"],
        "item_scores": item_summary["item_scores"],
        "liked_cafe_ids": review_summary["liked_cafe_ids"],
        "disliked_cafe_ids": review_summary["disliked_cafe_ids"],
        "review_keywords_positive": review_summary["top_positive_keywords"],
        "review_keywords_negative": review_summary["top_negative_keywords"],
        "interaction_counts": interaction_summary["counts"],
        "interaction_per_cafe": interaction_summary["per_cafe"],
        "inferred_traits": inferred_traits,
        "user_tag_ids": user_tag_ids,
        "user_tag_lookup": user_tag_lookup,
    }

    if include_raw:
        profile["raw"] = {
            "preferences": user_prefs,
            "preference_tags": user_tag_rows,
            "reviews": user_reviews,
            "interactions": interaction_rows,
            "user_item_preferences": user_item_prefs,
            "receipt_items": receipt_items,
        }

    return profile