from database.supabase_client import supabase


def get_user_preferences(user_id: str):
    response = (
        supabase.table("user_preferences")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return response.data


def upsert_user_preferences(user_id: str, payload: dict):
    data = {
        "user_id": user_id,
        "max_distance_miles": payload.get("max_distance_miles"),
        "wants_wifi": payload.get("wants_wifi", False),
        "preferred_price_level": payload.get("preferred_price_level"),
        "atmosphere": payload.get("atmosphere", []),
        "vibe": payload.get("vibe", []),
        "food_preferences": payload.get("food_preferences", []),
        "work_preferences": payload.get("work_preferences", []),
    }

    response = (
        supabase.table("user_preferences")
        .upsert(data, on_conflict="user_id")
        .execute()
    )

    return response.data or []


def get_user_preference_tags(user_id: str):
    response = (
        supabase.table("user_preference_tags")
        .select("tag_id, tags(id, name, category)")
        .eq("user_id", user_id)
        .execute()
    )
    return response.data or []


def replace_user_preference_tags(user_id: str, tag_ids: list[str]):
    supabase.table("user_preference_tags").delete().eq("user_id", user_id).execute()

    if not tag_ids:
        return []

    rows = [{"user_id": user_id, "tag_id": tag_id} for tag_id in tag_ids]

    response = supabase.table("user_preference_tags").insert(rows).execute()
    return response.data or []