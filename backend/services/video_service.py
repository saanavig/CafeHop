from database.supabase_client import supabase
from database.supabase_client import supabase_for_user

def create_video(access_token, user_id, cafe_id, video_url, caption):
    supabase = supabase_for_user(access_token)

    response = supabase.table("videos").insert({
        "user_id": user_id,
        "cafe_id": cafe_id,
        "video_url": video_url,
        "caption": caption
    }).execute()

    return response.data

# for the explore page
def get_feed_videos():
    response = (
        supabase.table("videos")
        .select("*")
        .eq("status", "active")
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )

    return response.data

# get videos
def get_cafe_videos(cafe_id):
    response = (
        supabase.table("videos")
        .select("*")
        .eq("cafe_id", cafe_id)
        .eq("status", "active")
        .order("created_at", desc=True)
        .execute()
    )

    return response.data