from database.supabase_client import supabase, supabase_for_user


def create_post(access_token, user_id, cafe_id, caption, post_type="user"):
    user_supabase = supabase_for_user(access_token)

    response = user_supabase.table("posts").insert({
        "user_id": user_id,
        "cafe_id": cafe_id,
        "caption": caption,
        "post_type": post_type,
        "likes_count": 0,
        "comments_count": 0,
    }).execute()

    return response.data[0]


def create_post_media(access_token, post_id, bucket_name, file_path, file_url, file_type):
    user_supabase = supabase_for_user(access_token)

    response = user_supabase.table("post_media").insert({
        "post_id": post_id,
        "bucket_name": bucket_name,
        "file_path": file_path,
        "file_url": file_url,
        "file_type": file_type,
    }).execute()

    return response.data[0]


def get_posts_by_user(access_token, user_id):
    response = (
        supabase.table("posts")
        .select("""
            id,
            user_id,
            cafe_id,
            caption,
            post_type,
            likes_count,
            comments_count,
            created_at,
            cafes(id, name, address, latitude, longitude),
            post_media(id, file_url, file_type, bucket_name, file_path)
        """)
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    return response.data or []


def get_posts_feed():
    response = (
        supabase.table("posts")
        .select("""
            id,
            user_id,
            cafe_id,
            caption,
            post_type,
            likes_count,
            comments_count,
            created_at,
            cafes(id, name, address, latitude, longitude),
            post_media(id, file_url, file_type, bucket_name, file_path)
        """)
        .order("created_at", desc=True)
        .execute()
    )

    return response.data or []


def get_posts_for_cafes(cafe_ids: list[str]):
    if not cafe_ids:
        return []

    response = (
        supabase.table("posts")
        .select("""
            id,
            user_id,
            cafe_id,
            caption,
            post_type,
            likes_count,
            comments_count,
            created_at,
            cafes(id, name, address, latitude, longitude),
            post_media(id, file_url, file_type, bucket_name, file_path)
        """)
        .in_("cafe_id", cafe_ids)
        .order("created_at", desc=True)
        .execute()
    )

    return response.data or []


def create_post_with_uploaded_media(
    access_token,
    user_id,
    cafe_id,
    caption,
    post_type,
    bucket_name,
    file_path,
    file_url,
    file_type,
):
    post = create_post(
        access_token=access_token,
        user_id=user_id,
        cafe_id=cafe_id,
        caption=caption,
        post_type=post_type,
    )

    media = create_post_media(
        access_token=access_token,
        post_id=post["id"],
        bucket_name=bucket_name,
        file_path=file_path,
        file_url=file_url,
        file_type=file_type,
    )

    return {
        "message": "Post created",
        "post": post,
        "media": media,
    }