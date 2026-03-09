from database.supabase_client import supabase_anon as supabase


def get_all_tags():
    response = supabase.table("tags").select("*").order("category").order("name").execute()
    return response.data or []


def get_cafe_tags(cafe_id: str):
    response = (
        supabase.table("cafe_tags")
        .select("tag_id, tags(id, name, category)")
        .eq("cafe_id", cafe_id)
        .execute()
    )
    return response.data or []


def replace_cafe_tags(cafe_id: str, tag_ids: list[str]):
    # Remove old tags
    supabase.table("cafe_tags").delete().eq("cafe_id", cafe_id).execute()

    if not tag_ids:
        return []

    rows = [{"cafe_id": cafe_id, "tag_id": tag_id} for tag_id in tag_ids]
    response = supabase.table("cafe_tags").insert(rows).execute()
    return response.data or []