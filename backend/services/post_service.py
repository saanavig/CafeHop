from database.supabase_client import supabase

def create_post(access_token, user_id, cafe_id, caption, post_type="user"):
    user_supabase = supabase_for_user(access_token)

    response = user_supabase.table("posts").insert({
        "user_id": user_id,
        "cafe_id": cafe_id,
        "caption": caption,
        "post_type": post_type
    }).execute()

    return response.data[0]

def get_posts_by_user(access_token, user_id):
    from database.supabase_client import supabase

    response = supabase.table("posts") \
        .select("id, caption, cafe_id, cafes(name), post_media(file_url)") \
        .eq("user_id", user_id) \
        .execute()

    formatted = []
    for p in response.data:
        media = p.get("post_media") or []

        formatted.append({
            "id": p["id"],
            "caption": p["caption"],
            "file_url": media[0]["file_url"] if len(media) > 0 else None,
            "cafe_name": p["cafes"]["name"] if p.get("cafes") else None
        })

    return formatted

def create_post_media(access_token, post_id, bucket_name, file_path, file_url, file_type):
    user_supabase = supabase_for_user(access_token)

    response = user_supabase.table("post_media").insert({
        "post_id": post_id,
        "bucket_name": bucket_name,
        "file_path": file_path,
        "file_url": file_url,
        "file_type": file_type
    }).execute()

    return response.data[0]


def create_post_with_uploaded_media(
    access_token,
    user_id,
    cafe_id,
    caption,
    post_type,
    bucket_name,
    file_path,
    file_url,
    file_type
):
    post = create_post(
        access_token=access_token,
        user_id=user_id,
        cafe_id=cafe_id,
        caption=caption,
        post_type=post_type
    )

    media = create_post_media(
        access_token=access_token,
        post_id=post["id"],
        bucket_name=bucket_name,
        file_path=file_path,
        file_url=file_url,
        file_type=file_type
    )

    return {
        "message": "Post created",
        "post": post,
        "media": media
    }