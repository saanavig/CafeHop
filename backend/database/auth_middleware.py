import os
import jwt
from functools import wraps
from flask import request, jsonify

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")

        if not token:
            return jsonify({"error": "Missing token"}), 401

        try:
            token = token.split(" ")[1]
            decoded = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )
            request.user = decoded
        except Exception as e:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)

    return decorated