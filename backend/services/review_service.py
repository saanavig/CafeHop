from collections import defaultdict
from database.supabase_client import supabase
from services.gemini_services import summarize_cafe_reviews_with_gemini


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


def attach_review_summaries_to_recommendations(recommendations, cafe_review_text_map):
    enriched = []

    for rec in recommendations:
        cafe = rec["cafe"]
        cafe_id = cafe.get("id")
        cafe_name = cafe.get("name")
        review_rows = cafe_review_text_map.get(cafe_id, [])

        rec["review_summary"] = summarize_cafe_reviews_with_gemini(cafe_name, review_rows)
        rec["review_samples"] = review_rows
        enriched.append(rec)

    return enriched