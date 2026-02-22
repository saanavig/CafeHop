from flask import Flask
import os
from flask_cors import CORS
from flask import jsonify, request
from database.supabase_client import supabase
from database.auth_middleware import require_auth

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

# testing supabase
# @app.route("/test-db")
# def test_db():
#     response = supabase.table("cafes").select("*").execute()
#     return success(response.data)

if __name__ == "__main__":
    app.run(debug=True)
