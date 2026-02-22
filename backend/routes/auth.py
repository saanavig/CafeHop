from jose import jwt
import requests
import os
from flask import request, jsonify, g
from functools import wraps
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")


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

        g.user = {
            "id": decoded.get("sub"),
            "email": decoded.get("email")
        }

        return f(*args, **kwargs)

    return decorated