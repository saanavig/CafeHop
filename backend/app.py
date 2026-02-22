from flask import Flask
import os
from flask_cors import CORS
from flask import jsonify, request
from database.supabase_client import supabase
from database.auth_middleware import require_auth
from routes.auth import require_auth
from flask import g

app = Flask(__name__)
CORS(app)

#response headers
def success(data=None, status=200):
    return jsonify({
        "success": True,
        "data": data
    }), status

def error(message, status=400):
    return jsonify({
        "success": False,
        "error": message
    }), status

# root route for testing
@app.route('/')
def home():
    return "Testing CafeHop"

# testing jwt for supabase
@app.route("/protected")
@require_auth
def protected():
    return {
        "message": "Authenticated",
        "user_id": g.user["id"]
    }

if __name__ == "__main__":
    app.run(debug=True)
