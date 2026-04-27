from collections import defaultdict
from database.supabase_client import supabase


def get_user_reviews(user_id: str):
    response = (
        supabase.table("reviews")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    return response.data or []


def get_cafe_review_stats():
    response = supabase.table("reviews").select("cafe_id, rating").execute()
    reviews = response.data or []

    cafe_review_map = defaultdict(list)

    for review in reviews:
        cafe_id = review.get("cafe_id")
        rating = review.get("rating")

        if cafe_id and rating is not None:
            cafe_review_map[cafe_id].append(rating)

    stats = {}

    for cafe_id, ratings in cafe_review_map.items():
        avg_rating = sum(ratings) / len(ratings)

        stats[cafe_id] = {
            "review_count": len(ratings),
            "avg_rating": round(avg_rating, 2),
        }

    return stats


def get_cafe_review_text_map(limit_per_cafe=5):
    response = (
        supabase.table("reviews")
        .select("cafe_id, review_text, rating, created_at")
        .order("created_at", desc=True)
        .execute()
    )

    reviews = response.data or []
    cafe_review_map = defaultdict(list)

    for review in reviews:
        cafe_id = review.get("cafe_id")
        review_text = review.get("review_text")
        rating = review.get("rating")

        if not cafe_id or not review_text:
            continue

        if len(cafe_review_map[cafe_id]) < limit_per_cafe:
            cafe_review_map[cafe_id].append({
                "rating": rating,
                "review_text": review_text,
            })

    return cafe_review_map


def build_rule_based_review_summary(review_rows: list[dict] | None):
    if not review_rows:
        return None

    positives = []
    negatives = []
    best_for = []

    text = " ".join(
        [str(row.get("review_text") or "").lower() for row in review_rows]
    )

    if "quiet" in text or "study" in text or "work" in text:
        best_for.append("studying or working")
    if "wifi" in text:
        positives.append("good WiFi")
    if "outlet" in text or "power" in text:
        positives.append("has outlets")
    if "matcha" in text:
        positives.append("popular matcha drinks")
    if "pastry" in text or "croissant" in text:
        positives.append("good pastries")
    if "busy" in text or "loud" in text or "noisy" in text:
        negatives.append("can get busy or loud")

    return {
        "vibe_summary": " ".join(best_for) if best_for else None,
        "positives": positives,
        "negatives": negatives,
        "best_for": best_for,
    }


def attach_review_summaries_to_recommendations(recommendations, cafe_review_text_map):
    enriched = []

    for rec in recommendations:
        cafe = rec["cafe"]
        cafe_id = cafe.get("id")
        review_rows = cafe_review_text_map.get(cafe_id, [])

        rec["review_summary"] = build_rule_based_review_summary(review_rows)
        rec["review_samples"] = review_rows

        enriched.append(rec)

    return enriched