from flask import Flask
import os
from flask_cors import CORS
from flask import jsonify, request

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

if __name__ == "__main__":
    app.run(debug=True)
