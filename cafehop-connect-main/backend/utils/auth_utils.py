from flask import request
from config import supabase

def get_user_id():
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return None

    token = auth_header.replace("Bearer ", "")

    try:
        response = supabase.auth.get_user(token)
        return response.user.id if response.user else None
    except Exception:
        return None