import os
import requests
from functools import wraps
from flask import request, jsonify, g
from config import SUPABASE_URL, SUPABASE_ANON_KEY

def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")

        if not auth.startswith("Bearer "):
            return jsonify({"error": "Invalid token", "details": "Missing Bearer token"}), 401

        token = auth.split(" ", 1)[1].strip()
        if not token:
            return jsonify({"error": "Invalid token", "details": "Empty token"}), 401

        # Validate token with Supabase and fetch user
        r = requests.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": SUPABASE_ANON_KEY,
            },
            timeout=10,
        )

        if r.status_code != 200:
            return jsonify({
                "error": "Invalid token",
                "supabase_status": r.status_code,
                "supabase_body": r.text,
            }), 401

        user = r.json()
        g.user = {
            "id": user["id"],
            "role": user.get("role", "authenticated"),
            "email": user.get("email"),
        }

        return fn(*args, **kwargs)

    return wrapper