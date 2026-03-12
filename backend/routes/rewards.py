from flask import Blueprint, jsonify
from services.purchase_repo import get_user_points, get_user_points_history

rewards_bp = Blueprint("rewards_bp", __name__)

# user points
@rewards_bp.route("/users/<user_id>/points", methods=["GET"])
def user_points(user_id):

    print("user_id received:", user_id)

    points = get_user_points(user_id)

    return jsonify({
        "user_id": user_id,
        "points": points
    }), 200

# user point history
@rewards_bp.route("/users/<user_id>/points/history", methods=["GET"])
def user_points_history(user_id):

    history = get_user_points_history(user_id)

    return jsonify({
        "user_id": user_id,
        "history": history
    }), 200