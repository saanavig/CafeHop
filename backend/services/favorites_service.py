from database.supabase_client import supabase


INTERACTION_TYPE = "favorite"


def get_user_favorite_cafe_ids(user_id: str) -> list[str]:
    response = (
        supabase.table("user_cafe_interactions")
        .select("cafe_id, created_at")
        .eq("user_id", user_id)
        .eq("interaction_type", INTERACTION_TYPE)
        .order("created_at", desc=True)
        .execute()
    )

    rows = response.data or []
    return [row["cafe_id"] for row in rows if row.get("cafe_id")]


def get_user_favorites(user_id: str) -> list[dict]:
    interaction_response = (
        supabase.table("user_cafe_interactions")
        .select("cafe_id, created_at")
        .eq("user_id", user_id)
        .eq("interaction_type", INTERACTION_TYPE)
        .order("created_at", desc=True)
        .execute()
    )

    interaction_rows = interaction_response.data or []
    if not interaction_rows:
        return []

    cafe_ids = [row["cafe_id"] for row in interaction_rows if row.get("cafe_id")]
    if not cafe_ids:
        return []

    cafes_response = (
        supabase.table("cafes")
        .select("""
            id,
            name,
            address,
            latitude,
            longitude,
            image_url,
            description,
            price_level,
            active,
            attributes
        """)
        .in_("id", cafe_ids)
        .execute()
    )

    cafes = cafes_response.data or []
    cafe_map = {cafe["id"]: cafe for cafe in cafes if cafe.get("id")}

    favorites = []
    for row in interaction_rows:
        cafe_id = row.get("cafe_id")
        cafe = cafe_map.get(cafe_id)

        if not cafe:
            continue

        favorites.append({
            "favorited_at": row.get("created_at"),
            "cafe": cafe,
        })
    return favorites


def is_favorite(user_id: str, cafe_id: str) -> bool:
    response = (
        supabase.table("user_cafe_interactions")
        .select("user_id")
        .eq("user_id", user_id)
        .eq("cafe_id", cafe_id)
        .eq("interaction_type", INTERACTION_TYPE)
        .limit(1)
        .execute()
    )
    return bool(response.data)


def add_favorite(user_id: str, cafe_id: str) -> dict:
    if is_favorite(user_id, cafe_id):
        return {
            "added": False,
            "already_favorited": True,
            "user_id": user_id,
            "cafe_id": cafe_id,
        }

    response = (
        supabase.table("user_cafe_interactions")
        .insert({
            "user_id": user_id,
            "cafe_id": cafe_id,
            "interaction_type": INTERACTION_TYPE,
        })
        .execute()
    )

    inserted = response.data[0] if response.data else None

    return {
        "added": True,
        "already_favorited": False,
        "favorite": inserted,
    }


def remove_favorite(user_id: str, cafe_id: str) -> dict:
    response = (
        supabase.table("user_cafe_interactions")
        .delete()
        .eq("user_id", user_id)
        .eq("cafe_id", cafe_id)
        .eq("interaction_type", INTERACTION_TYPE)
        .execute()
    )

    removed_rows = response.data or []

    return {
        "removed": len(removed_rows) > 0,
        "count": len(removed_rows),
        "user_id": user_id,
        "cafe_id": cafe_id,
    }


def toggle_favorite(user_id: str, cafe_id: str) -> dict:
    if is_favorite(user_id, cafe_id):
        removed = remove_favorite(user_id, cafe_id)
        return {
            "favorited": False,
            "action": "removed",
            **removed,
        }

    added = add_favorite(user_id, cafe_id)
    return {
        "favorited": True,
        "action": "added",
        **added,
    }