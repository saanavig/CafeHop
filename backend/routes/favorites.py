from flask import Blueprint, jsonify, g
from database.auth_middleware import require_auth
from services.favorites_service import (
    get_user_favorites,
    add_favorite,
    remove_favorite,
    toggle_favorite,
    is_favorite,
)

favorites_bp = Blueprint("favorites_bp", __name__)


@favorites_bp.route("/users/me/favorites", methods=["GET"])
@require_auth
def get_my_favorites():
    favorites = get_user_favorites(g.user["id"])
    return jsonify({"favorites": favorites}), 200


@favorites_bp.route("/cafes/<cafe_id>/favorite", methods=["GET"])
@require_auth
def get_favorite_status(cafe_id):
    favorited = is_favorite(g.user["id"], cafe_id)
    return jsonify({
        "cafe_id": cafe_id,
        "favorited": favorited,
    }), 200


@favorites_bp.route("/cafes/<cafe_id>/favorite", methods=["POST"])
@require_auth
def favorite_cafe(cafe_id):
    result = add_favorite(g.user["id"], cafe_id)
    return jsonify(result), 200


@favorites_bp.route("/cafes/<cafe_id>/favorite", methods=["DELETE"])
@require_auth
def unfavorite_cafe(cafe_id):
    result = remove_favorite(g.user["id"], cafe_id)
    return jsonify(result), 200


@favorites_bp.route("/cafes/<cafe_id>/favorite/toggle", methods=["POST"])
@require_auth
def toggle_favorite_cafe(cafe_id):
    result = toggle_favorite(g.user["id"], cafe_id)
    return jsonify(result), 200