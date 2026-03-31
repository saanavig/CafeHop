from flask import Blueprint, request, jsonify, g
from routes.auth import require_auth
from services.nearby_service import find_nearby_cafes

nearby_bp = Blueprint("nearby_bp", __name__)


@nearby_bp.route("/cafes/nearby", methods=["GET"])
@require_auth
def nearby_cafes():
    user_id = g.user.get("id")

    lat = request.args.get("latitude")
    lon = request.args.get("longitude")

    if lat is None or lon is None:
        return jsonify({"error": "latitude and longitude required"}), 400

    try:
        user_lat = float(lat)
        user_lon = float(lon)
    except:
        return jsonify({"error": "invalid coordinates"}), 400

    result = find_nearby_cafes(user_id, user_lat, user_lon)

    return jsonify(result), 200