import json
from database.supabase_client import supabase_anon as supabase
from services.preference_service import get_user_preferences, get_user_preference_tags
from services.gemini_services import generate_text
from utils.text_utils import extract_json


def get_candidate_cafes():
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
        .select("cafe_id, tag_id, tags(id,name,category)")
        .execute()
    )

    rows = response.data or []
    cafe_to_tags = {}

    for row in rows:
        cafe_id = row["cafe_id"]
        tag = row.get("tags")

        if cafe_id not in cafe_to_tags:
            cafe_to_tags[cafe_id] = []

        if tag:
            cafe_to_tags[cafe_id].append(tag)

    return cafe_to_tags


def recommend_cafes_for_user(user_id: str):

    prefs = get_user_preferences(user_id) or {}
    pref_tags_rows = get_user_preference_tags(user_id) or []

    preferred_tags = [r["tags"]["name"] for r in pref_tags_rows if r.get("tags")]

    cafes = get_candidate_cafes()
    cafe_tags_map = get_all_cafe_tags()

    # Build Gemini candidate payload
    candidates = []

    for cafe in cafes:

        cafe_id = cafe["id"]
        tags = cafe_tags_map.get(cafe_id, [])

        candidates.append({
            "cafe_id": cafe_id,
            "name": cafe.get("name"),
            "description": cafe.get("description"),
            "wifi": cafe.get("wifi"),
            "outlets": cafe.get("outlets"),
            "price_level": cafe.get("price_level"),
            "noise_level": cafe.get("noise_level"),
            "tags": [t["name"] for t in tags]
        })

    prompt = f"""
You are an AI cafe recommendation system.

User preferences:
{json.dumps({
    "preferences": prefs,
    "preferred_tags": preferred_tags
}, indent=2)}

Candidate cafes:
{json.dumps(candidates[:15], indent=2)}

Rank the BEST cafes for this user.

Return JSON only:

{{
 "recommendations":[
   {{
     "cafe_id":"uuid",
     "score":0-100,
     "reason":"short explanation"
   }}
 ]
}}

Return at most 5 cafes.
Do not invent cafes.
Only use cafes from the candidate list.
"""

    raw = generate_text(prompt)

    try:
        parsed = json.loads(extract_json(raw))
    except:
        return []

    results = parsed.get("recommendations", [])

    cafe_map = {c["cafe_id"]: c for c in candidates}

    final = []

    for r in results:
        cid = r.get("cafe_id")
        if cid not in cafe_map:
            continue

        final.append({
            "score": r.get("score", 0),
            "reason": r.get("reason"),
            "cafe": cafe_map[cid]
        })

    return final