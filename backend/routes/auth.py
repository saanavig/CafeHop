from jose import jwt
import requests
import os
from flask import request, jsonify, g
from functools import wraps
from dotenv import load_dotenv
from supabase import create_client


load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")


#call supabase 
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

def get_jwks():
    url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    response = requests.get(url)
    return response.json()


def verify_token(token):
    try:
        jwks = get_jwks()
        unverified_header = jwt.get_unverified_header(token)

        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = key
                break

        if not rsa_key:
            print("No matching RSA key found")
            return None

        decoded = jwt.decode(
            token,
            rsa_key,
            algorithms=["ES256"],
            audience="authenticated"
        )
        return decoded

    except Exception as e:
        print("JWT verification error:", e)
        return None

    except Exception as e:
        print("JWT verification error:", e)
        return None


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"error": "Missing token"}), 401
        try:
            token = auth_header.split(" ")[1]
        except IndexError:
            return jsonify({"error": "Invalid auth header"}), 401

        decoded = verify_token(token)

        if not decoded:
            return jsonify({"error": "Invalid or expired token"}), 401

        user_id = decoded.get("sub")
        role = get_user_role(user_id)

        if not role:
            return jsonify({"error": "User profile not found"}), 403

        g.user = {
            "id": user_id,
            "email": decoded.get("email"),
            "role": role
        }

        return f(*args, **kwargs)

    return decorated

# user roles
def get_user_role(user_id):
    response = supabase.table("profiles") \
        .select("role") \
        .eq("id", user_id) \
        .single() \
        .execute()

    if not response.data:
        return None

    return response.data["role"]

# cafe owner role
def require_role(required_role):
    def wrapper(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if g.user.get("role") != required_role:
                return jsonify({"error": "Forbidden"}), 403
            return f(*args, **kwargs)
        return decorated
    return wrapper