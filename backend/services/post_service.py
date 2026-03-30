import os
import uuid
from database.supabase_client import supabase, supabase_for_user

def upload_media_file(access_token, file, cafe_id, user_id, post_id):
    user_supabase = supabase_for_user(access_token)

    original_name = file.filename or "upload"
    ext = os.path.splitext(original_name)[1].lower()

    image_exts = [".jpg", ".jpeg", ".png", ".webp"]
    video_exts = [".mp4", ".mov"]

    if ext in image_exts:
        bucket_name = "images"
        file_type = "image"
        content_type = file.mimetype or "image/jpeg"
    elif ext in video_exts:
        bucket_name = "videos"
        file_type = "video"
        content_type = file.mimetype or "video/mp4"
    else:
        raise ValueError("Unsupported file type")

    filename = f"{uuid.uuid4()}{ext}"
    file_path = f"cafes/{cafe_id}/users/{user_id}/posts/{post_id}/{filename}"

    user_supabase.storage.from_(bucket_name).upload(
        file_path,
        file.read(),
        {"content-type": content_type}
    )

    public_url_result = user_supabase.storage.from_(bucket_name).get_public_url(file_path)

    if isinstance(public_url_result, str):
        file_url = public_url_result
    else:
        file_url = public_url_result.get("publicUrl")

    return {
        "bucket_name": bucket_name,
        "file_path": file_path,
        "file_url": file_url,
        "file_type": file_type
    }



def create_post(access_token, user_id, cafe_id, caption, post_type="user"):
    user_supabase = supabase_for_user(access_token)

    response = user_supabase.table("posts").insert({
        "user_id": user_id,
        "cafe_id": cafe_id,
        "caption": caption,
        "post_type": post_type,
        "status": "active"
    }).execute()

    return response.data[0]


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


def create_post_with_media(access_token, user_id, cafe_id, caption, files, post_type="user"):
    post = create_post(access_token, user_id, cafe_id, caption, post_type)

    media_items = []

    for file in files:
        uploaded = upload_media_file(access_token, file, cafe_id, user_id, post["id"])

        media = create_post_media(
            access_token=access_token,
            post_id=post["id"],
            bucket_name=uploaded["bucket_name"],
            file_path=uploaded["file_path"],
            file_url=uploaded["file_url"],
            file_type=uploaded["file_type"]
        )

        media_items.append(media)

    return {
        "post": post,
        "media": media_items
    }


def get_feed_posts(limit=20):
    response = (
        supabase.table("posts")
        .select("*, post_media(*)")
        .eq("status", "active")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    return response.data


def get_cafe_posts(cafe_id):
    response = (
        supabase.table("posts")
        .select("*, post_media(*)")
        .eq("cafe_id", cafe_id)
        .eq("status", "active")
        .order("created_at", desc=True)
        .execute()
    )

    return response.data


def get_user_posts(user_id):
    response = (
        supabase.table("posts")
        .select("*, cafes(name), post_media(*)")
        .eq("user_id", user_id)
        .eq("status", "active")
        .order("created_at", desc=True)
        .execute()
    )

    return response.data