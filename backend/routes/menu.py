from flask import Blueprint, jsonify, request, g
from database.auth_middleware import require_auth
from services.menu_service import (
    get_menu_items_for_cafe,
    replace_menu_items_for_cafe,
)

menu_bp = Blueprint("menu_bp", __name__)


@menu_bp.route("/cafes/<cafe_id>/menu", methods=["GET"])
def get_cafe_menu(cafe_id):
    items = get_menu_items_for_cafe(cafe_id)
    return jsonify({
        "cafe_id": cafe_id,
        "menu_items": items
    }), 200


@menu_bp.route("/cafes/<cafe_id>/menu", methods=["PUT"])
@require_auth
def update_cafe_menu(cafe_id):
    body = request.get_json(silent=True) or {}
    items = body.get("items", [])

    if not isinstance(items, list):
        return jsonify({"error": "items must be a list"}), 400

    updated = replace_menu_items_for_cafe(cafe_id, items)

    return jsonify({
        "message": "Menu updated successfully",
        "cafe_id": cafe_id,
        "menu_items": updated
    }), 200