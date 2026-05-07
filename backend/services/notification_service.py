from database.supabase_client import supabase_admin as supabase


def create_notification(
    user_id,
    notif_type,
    title,
    message,
    related_id=None,
):
    data = {
        "user_id": user_id,
        "type": notif_type,
        "title": title,
        "message": message,
        "related_id": related_id,
    }

    return supabase.table("notifications").insert(data).execute()